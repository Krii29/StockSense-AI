import os
from typing import Literal
 
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import requests
import yfinance as yf
 
load_dotenv()
 
UPSTOX_ACCESS_TOKEN = os.getenv("UPSTOX_ACCESS_TOKEN")
 
 
def upstox_headers() -> dict:
    if not UPSTOX_ACCESS_TOKEN:
        raise HTTPException(
            status_code=500,
            detail="UPSTOX_ACCESS_TOKEN is not configured on the server.",
        )
    return {
        "Authorization": f"Bearer {UPSTOX_ACCESS_TOKEN}",
        "Accept": "application/json",
    }
 
 
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
 
_instrument_cache: dict[tuple[str, str], dict] = {}
 
 
def find_upstox_instrument(symbol: str, market: str) -> dict:
    resolved_symbol = normalise_symbol(symbol, market)
    cache_key = (resolved_symbol, market)
    if cache_key in _instrument_cache:
        return _instrument_cache[cache_key]
 
    response = requests.get(
        "https://api.upstox.com/v2/instruments/search",
        headers=upstox_headers(),
        params={
            "query": resolved_symbol,
            "exchanges": market,
            "segments": "EQ",
            "page_number": 1,
            "records": 30,
        },
        timeout=10,
    )
    response.raise_for_status()
    matches = response.json().get("data", [])
    exact_match = next(
        (item for item in matches if item.get("trading_symbol", "").upper() == resolved_symbol),
        None,
    )
    if not exact_match:
        raise HTTPException(status_code=404, detail=f"'{symbol}' was not found on {market}.")
 
    _instrument_cache[cache_key] = exact_match
    return exact_match
 
 
def fetch_upstox_stock(symbol: str, market: Literal["NSE", "BSE"]) -> dict:
    instrument = find_upstox_instrument(symbol, market)
    instrument_key = instrument["instrument_key"]
    response = requests.get(
        "https://api.upstox.com/v2/market-quote/quotes",
        headers=upstox_headers(),
        params={"instrument_key": instrument_key},
        timeout=10,
    )
    response.raise_for_status()
    payload = response.json().get("data", {})
    # Upstox keys the response by a symbol-style string (e.g. "NSE_EQ:RELIANCE"),
    # not by the instrument_key we sent in the request — so look up by value,
    # not by exact key match.
    quote = payload.get(instrument_key)
    if not quote and payload:
        quote = next(iter(payload.values()), None)
    if not quote:
        raise HTTPException(status_code=404, detail=f"No quote is available for '{symbol}' on {market}.")
 
    current_price = float(quote["last_price"])
    previous_close = float(quote.get("ohlc", {}).get("close") or current_price)
    price_change = current_price - previous_close
    change_percent = (price_change / previous_close * 100) if previous_close else 0
 
    return {
        "symbol": instrument["trading_symbol"],
        "companyName": instrument.get("name") or instrument["trading_symbol"],
        "market": market,
        "currentPrice": round(current_price, 2),
        "high": round(float(quote.get("ohlc", {}).get("high") or current_price), 2),
        "low": round(float(quote.get("ohlc", {}).get("low") or current_price), 2),
        "volume": int(quote.get("volume") or 0),
        "priceChange": round(price_change, 2),
        "changePercent": round(change_percent, 2),
        "currency": "INR",
        "currencySymbol": "₹",
        "dataStatus": "Upstox market-data snapshot · refreshes every 5 seconds.",
    }
 
 
@app.get("/stocks/{symbol}")
def get_stock(
    symbol: str,
    market: Literal["NSE", "BSE", "CRYPTO", "FOREX"] = Query(default="NSE"),
):
    if market in {"NSE", "BSE"} and UPSTOX_ACCESS_TOKEN:
        try:
            return fetch_upstox_stock(symbol, market)
        except HTTPException:
            raise
        except requests.RequestException:
            pass  # fall through to yfinance below
 
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
    
# Maps a UI timeframe button to a yfinance (period, interval) pair.
# Intraday intervals (1m/5m) are only available for recent days on Yahoo's API,
# which is why 1D/1W use short periods.
RANGE_MAP: dict[str, tuple[str, str]] = {
    "1D": ("1d", "5m"),
    "1W": ("5d", "15m"),
    "1M": ("1mo", "1d"),
    "3M": ("3mo", "1d"),
    "1Y": ("1y", "1d"),
    "5Y": ("5y", "1wk"),
}


@app.get("/stocks/{symbol}/history")
def get_stock_history(
    symbol: str,
    market: Literal["NSE", "BSE", "CRYPTO", "FOREX"] = Query(default="NSE"),
    range: Literal["1D", "1W", "1M", "3M", "1Y", "5Y"] = Query(default="1M"),
):
    period, interval = RANGE_MAP[range]
    ticker_symbol = ticker_for_market(symbol, market)
    ticker = yf.Ticker(ticker_symbol)
    hist = ticker.history(period=period, interval=interval, auto_adjust=False)
    if hist.empty:
        raise HTTPException(status_code=404, detail=f"No history for '{symbol}'.")

    candlesticks = [
        {
            "time": int(idx.timestamp()),
            "open": round(float(row["Open"]), 2),
            "high": round(float(row["High"]), 2),
            "low": round(float(row["Low"]), 2),
            "close": round(float(row["Close"]), 2),
        }
        for idx, row in hist.iterrows()
    ]
    volume = [
        {"time": int(idx.timestamp()), "value": int(row["Volume"] or 0)}
        for idx, row in hist.iterrows()
    ]
    return {"candlesticks": candlesticks, "volume": volume}


# Yahoo Finance tickers for the major Indian indices shown in the overview strip.
INDEX_TICKERS: dict[str, str] = {
    "NIFTY 50": "^NSEI",
    "SENSEX": "^BSESN",
    "BANK NIFTY": "^NSEBANK",
}


@app.get("/indices")
def get_indices():
    results = []
    for name, ticker_symbol in INDEX_TICKERS.items():
        try:
            hist = yf.Ticker(ticker_symbol).history(period="5d", interval="1d", auto_adjust=False)
            if hist.empty:
                continue
            current = float(hist["Close"].iloc[-1])
            previous = float(hist["Close"].iloc[-2]) if len(hist) > 1 else current
            change = current - previous
            change_percent = (change / previous * 100) if previous else 0
            results.append({
                "name": name,
                "value": round(current, 2),
                "change": round(change, 2),
                "changePercent": round(change_percent, 2),
            })
        except Exception:
            continue  # skip an index if Yahoo has no data for it right now
    return {"indices": results}