import pandas as pd
from typing import Literal
from app.ml.predictor import get_prediction

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import time as time_module
from app.db import init_db, save_price_history, get_price_history, save_news, get_cached_news

init_db()

_sentiment_pipeline = None


def get_sentiment_pipeline():
    global _sentiment_pipeline
    if _sentiment_pipeline is None:
        from transformers import pipeline
        _sentiment_pipeline = pipeline("sentiment-analysis", model="ProsusAI/finbert")
    return _sentiment_pipeline

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Common company-name searches resolve to their exchange trading symbols.
INDIAN_MAP = {
    "RELIANCE": "RELIANCE",
    "TCS": "TCS",
    "TATA MOTORS": "TATAMOTORS",
    "TATAMOTORS": "TATAMOTORS",
    "INFOSYS": "INFY",
    "INFY": "INFY",
    "WIPRO": "WIPRO",
    "HDFC": "HDFCBANK",
    "ICICI": "ICICIBANK",
    "SBI": "SBIN",
}

CRYPTO_MAP = {
    "BTC": "BTC-USD",
    "BTCUSD": "BTC-USD",
    "BITCOIN": "BTC-USD",
    "ETH": "ETH-USD",
    "ETHUSD": "ETH-USD",
    "ETHEREUM": "ETH-USD",
    "SOL": "SOL-USD",
    "SOLUSD": "SOL-USD",
    "SOLANA": "SOL-USD",
    "XRP": "XRP-USD",
    "XRPUSD": "XRP-USD",
    "RIPPLE": "XRP-USD",
    "DOGE": "DOGE-USD",
    "DOGEUSD": "DOGE-USD",
    "DOGECOIN": "DOGE-USD",
}

FOREX_MAP = {
    "USDINR": "USDINR=X",
    "EURINR": "EURINR=X",
    "GBPINR": "GBPINR=X",
    "EURUSD": "EURUSD=X",
    "GBPUSD": "GBPUSD=X",
    "USDJPY": "JPY=X",
    "AUDUSD": "AUDUSD=X",
}


def normalise_symbol(symbol: str, market: str) -> str:
    """Convert user-friendly stock, crypto, or forex inputs into Yahoo tickers."""
    raw = symbol.strip().upper()
    if market in {"NSE", "BSE"}:
        raw = raw.removesuffix(".NS").removesuffix(".BO")
        return INDIAN_MAP.get(raw, raw)

    pair = raw.replace("/", "").replace("-", "")
    if market == "CRYPTO":
        return CRYPTO_MAP.get(pair, raw if "-" in raw else f"{raw}-USD")

    pair = pair.removesuffix("=X")
    return FOREX_MAP.get(pair, raw if raw.endswith("=X") else f"{pair}=X")


def ticker_for_market(symbol: str, market: str) -> str:
    resolved = normalise_symbol(symbol, market)
    suffix = {"NSE": ".NS", "BSE": ".BO"}.get(market, "")
    return f"{resolved}{suffix}"

@app.get("/stocks/{symbol}")
def get_stock(
    symbol: str,
    market: Literal["NSE", "BSE", "CRYPTO", "FOREX"] = Query(default="NSE"),
):
    ticker_symbol = ticker_for_market(symbol, market)
    try:
        ticker = yf.Ticker(ticker_symbol)
        daily_history = ticker.history(period="5d", auto_adjust=False)
        intraday_history = ticker.history(period="1d", interval="1m", auto_adjust=False)
        if daily_history.empty and intraday_history.empty:
            raise ValueError("No price history")

        latest = intraday_history.iloc[-1] if not intraday_history.empty else daily_history.iloc[-1]
        daily_latest = daily_history.iloc[-1] if not daily_history.empty else latest
        current_price = float(latest["Close"])
        previous_close = float(daily_history["Close"].iloc[-2]) if len(daily_history) > 1 else current_price
        price_change = current_price - previous_close
        change_percent = (price_change / previous_close * 100) if previous_close else 0

        try:
            info = ticker.info
            company_name = info.get("longName") or info.get("shortName") or normalise_symbol(symbol, market)
        except Exception:
            company_name = normalise_symbol(symbol, market)

        return {
            "symbol": ticker_symbol,
            "companyName": company_name,
            "market": market,
            "currentPrice": round(current_price, 2),
            "high": round(float(daily_latest["High"]), 2),
            "low": round(float(daily_latest["Low"]), 2),
            "volume": int(daily_latest["Volume"] or 0),
            "priceChange": round(price_change, 2),
            "changePercent": round(change_percent, 2),
            "currency": "INR" if market in {"NSE", "BSE"} else "USD" if market == "CRYPTO" else "PAIR",
            "currencySymbol": "₹" if market in {"NSE", "BSE"} else "$" if market == "CRYPTO" else "",
            "dataStatus": "Auto-refreshing data; prices may be delayed.",
        }
    except Exception as error:
        raise HTTPException(
            status_code=404,
            detail=f"'{symbol}' was not found in {market}. Check the symbol and try again.",
        ) from error
    
@app.get("/stocks/{symbol}/history")
def get_stock_history(
    symbol: str,
    market: Literal["NSE", "BSE", "CRYPTO", "FOREX"] = Query(default="NSE"),
    period: str = Query(default="6mo"),
    interval: str = Query(default="1d"),
):
    clean_symbol = symbol.strip().upper()
    ticker_symbol = ticker_for_market(symbol, market)

    try:
        cached = get_price_history(clean_symbol, market, interval)
        if cached:
            return {"symbol": ticker_symbol, "interval": interval, "candles": cached}

        ticker = yf.Ticker(ticker_symbol)
        hist = ticker.history(period=period, interval=interval, auto_adjust=False)
        if hist.empty:
            raise ValueError("No history")

        candles = []
        for idx, row in hist.iterrows():
            if row[["Open", "High", "Low", "Close"]].isna().any():
                continue  # skip incomplete/missing trading days

            candles.append({
                "time": int(idx.timestamp()),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]) if pd.notna(row["Volume"]) else 0,
            })

        if not candles:
            raise ValueError("No valid history rows")

        save_price_history(clean_symbol, market, interval, candles)
        return {"symbol": ticker_symbol, "interval": interval, "candles": candles}
    except Exception as error:
        print(f"[/history error] {symbol} {market}: {error}")
        raise HTTPException(
            status_code=404,
            detail=f"No historical data for '{symbol}' in {market}.",
        ) from error


@app.get("/stocks/{symbol}/news")
def get_stock_news(
    symbol: str,
    market: Literal["NSE", "BSE", "CRYPTO", "FOREX"] = Query(default="NSE"),
):
    clean_symbol = symbol.strip().upper()

    cached = get_cached_news(clean_symbol, market)
    if cached:
        return {"symbol": clean_symbol, "articles": cached}

    ticker_symbol = ticker_for_market(symbol, market)
    try:
        ticker = yf.Ticker(ticker_symbol)
        raw_news = ticker.news or []
        if not raw_news:
            return {"symbol": clean_symbol, "articles": []}

        headlines = []
        for item in raw_news[:10]:
            content = item.get("content", item) if isinstance(item, dict) else {}
            title = content.get("title") or item.get("title")
            link = ((content.get("canonicalUrl") or {}).get("url")) or item.get("link") or ""
            pub_date = content.get("pubDate") or content.get("displayTime") or ""
            if title:
                headlines.append({"title": title, "link": link, "pub_date": str(pub_date)})

        if not headlines:
            return {"symbol": clean_symbol, "articles": []}

        pipe = get_sentiment_pipeline()
        results = pipe([h["title"] for h in headlines])

        articles = []
        for h, r in zip(headlines, results):
            articles.append({
                "title": h["title"],
                "link": h["link"],
                "published": h["pub_date"],
                "sentiment": r["label"],
                "score": round(float(r["score"]), 3),
            })

        save_news(clean_symbol, market, articles)
        return {"symbol": clean_symbol, "articles": articles}
    except Exception as error:
        raise HTTPException(
            status_code=404,
            detail=f"Could not fetch news for '{symbol}'.",
        ) from error
    
@app.get("/stocks/{symbol}/predict")
def predict_stock(
    symbol: str,
    market: Literal["NSE", "BSE", "CRYPTO", "FOREX"] = Query(default="NSE"),
    days: int = Query(default=5, ge=1, le=10),
):
    clean_symbol = symbol.strip().upper()
    ticker_symbol = ticker_for_market(symbol, market)
    try:
        result = get_prediction(clean_symbol, market, ticker_symbol, days_ahead=days)
        return {"symbol": clean_symbol, "market": market, **result}
    except Exception as error:
        print(f"[/predict error] {symbol} {market}: {error}")
        raise HTTPException(
            status_code=404,
            detail=f"Could not generate a prediction for '{symbol}'.",
        ) from error
