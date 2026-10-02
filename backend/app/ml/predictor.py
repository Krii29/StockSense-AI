import time
from pathlib import Path

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import yfinance as yf
from sklearn.preprocessing import MinMaxScaler

from app.db import get_price_history, save_price_history

MODEL_DIR = Path(__file__).resolve().parent.parent.parent / "models"
MODEL_DIR.mkdir(exist_ok=True)

SEQ_LEN = 30
MODEL_MAX_AGE_SECONDS = 24 * 3600


class LSTMPredictor(nn.Module):
    def __init__(self, input_size=1, hidden_size=32, num_layers=2):
        super().__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, 1)

    def forward(self, x):
        out, _ = self.lstm(x)
        out = out[:, -1, :]
        return self.fc(out)


def _model_path(symbol, market):
    return MODEL_DIR / f"{symbol}_{market}.pt"


def _get_training_data(symbol, market, ticker_symbol):
    cached = get_price_history(symbol, market, "1d", max_age_seconds=6 * 3600)
    if len(cached) >= 120:
        return [c["close"] for c in cached]

    ticker = yf.Ticker(ticker_symbol)
    hist = ticker.history(period="2y", interval="1d", auto_adjust=False)
    hist = hist.dropna(subset=["Open", "High", "Low", "Close"])
    if hist.empty or len(hist) < 60:
        raise ValueError("Not enough historical data to train a model")

    candles = []
    for idx, row in hist.iterrows():
        candles.append({
            "time": int(idx.timestamp()),
            "open": round(float(row["Open"]), 2),
            "high": round(float(row["High"]), 2),
            "low": round(float(row["Low"]), 2),
            "close": round(float(row["Close"]), 2),
            "volume": int(row["Volume"]) if pd.notna(row["Volume"]) else 0,
        })
    save_price_history(symbol, market, "1d", candles)
    return [c["close"] for c in candles]


def _make_sequences(values, seq_len):
    X, y = [], []
    for i in range(len(values) - seq_len):
        X.append(values[i:i + seq_len])
        y.append(values[i + seq_len])
    return np.array(X), np.array(y)


def _train_model(closes):
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled = scaler.fit_transform(np.array(closes).reshape(-1, 1)).flatten()

    X, y = _make_sequences(scaled, SEQ_LEN)
    X = torch.tensor(X, dtype=torch.float32).unsqueeze(-1)
    y = torch.tensor(y, dtype=torch.float32).unsqueeze(-1)

    model = LSTMPredictor()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.01)
    loss_fn = nn.MSELoss()

    model.train()
    for _ in range(40):
        optimizer.zero_grad()
        pred = model(X)
        loss = loss_fn(pred, y)
        loss.backward()
        optimizer.step()

    return model, scaler


def _forecast(model, scaler, closes, days_ahead):
    scaled_all = scaler.transform(np.array(closes).reshape(-1, 1)).flatten()
    window = list(scaled_all[-SEQ_LEN:])

    model.eval()
    predictions = []
    with torch.no_grad():
        for _ in range(days_ahead):
            x = torch.tensor(window[-SEQ_LEN:], dtype=torch.float32).view(1, SEQ_LEN, 1)
            next_scaled = model(x).item()
            predictions.append(next_scaled)
            window.append(next_scaled)

    predictions = scaler.inverse_transform(np.array(predictions).reshape(-1, 1)).flatten()
    return [round(float(p), 2) for p in predictions]


def get_prediction(symbol, market, ticker_symbol, days_ahead=5):
    closes = _get_training_data(symbol, market, ticker_symbol)

    model_file = _model_path(symbol, market)
    if model_file.exists() and (time.time() - model_file.stat().st_mtime) < MODEL_MAX_AGE_SECONDS:
        checkpoint = torch.load(model_file, weights_only=False)
        model = LSTMPredictor()
        model.load_state_dict(checkpoint["state_dict"])
        scaler = checkpoint["scaler"]
    else:
        model, scaler = _train_model(closes)
        torch.save({"state_dict": model.state_dict(), "scaler": scaler}, model_file)

    forecast = _forecast(model, scaler, closes, days_ahead)

    returns = np.diff(closes[-60:]) / np.array(closes[-60:-1])
    volatility_pct = round(float(np.std(returns) * 100), 2)

    last_close = closes[-1]
    trend = "bullish" if forecast[-1] > last_close else "bearish" if forecast[-1] < last_close else "neutral"

    return {
        "last_close": round(float(last_close), 2),
        "forecast": forecast,
        "trend": trend,
        "volatility_pct": volatility_pct,
    }
