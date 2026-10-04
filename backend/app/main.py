import pandas as pd
from typing import Literal

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import yfinance as yf

from app.ml.predictor import get_prediction
from app.db import (
    init_db,
    save_price_history,
    get_price_history,
    save_news,
    get_cached_news,
)


# ============================================================
# INITIALIZATION
# ============================================================

init_db()

_sentiment_pipeline = None


def get_sentiment_pipeline():
    global _sentiment_pipeline

    if _sentiment_pipeline is None:
        from transformers import pipeline

        _sentiment_pipeline = pipeline(
            "sentiment-analysis",
            model="ProsusAI/finbert",
        )

    return _sentiment_pipeline


app = FastAPI(title="StockSense AI API")


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# SYMBOL MAPS
# ============================================================

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


# ============================================================
# SYMBOL HELPERS
# ============================================================

def normalise_symbol(symbol: str, market: str) -> str:
    """Convert user-friendly symbols into Yahoo Finance tickers."""

    raw = symbol.strip().upper()

    if market in {"NSE", "BSE"}:
        raw = raw.removesuffix(".NS").removesuffix(".BO")
        return INDIAN_MAP.get(raw, raw)

    pair = raw.replace("/", "").replace("-", "")

    if market == "CRYPTO":
        return CRYPTO_MAP.get(
            pair,
            raw if "-" in raw else f"{raw}-USD",
        )

    pair = pair.removesuffix("=X")

    return FOREX_MAP.get(
        pair,
        raw if raw.endswith("=X") else f"{pair}=X",
    )


def ticker_for_market(symbol: str, market: str) -> str:
    resolved = normalise_symbol(symbol, market)

    suffix = {
        "NSE": ".NS",
        "BSE": ".BO",
    }.get(market, "")

    return f"{resolved}{suffix}"


# ============================================================
# STOCK DATA
# ============================================================

@app.get("/stocks/{symbol}")
def get_stock(
    symbol: str,
    market: Literal["NSE", "BSE", "CRYPTO", "FOREX"] = Query(
        default="NSE"
    ),
):
    ticker_symbol = ticker_for_market(symbol, market)

    try:
        ticker = yf.Ticker(ticker_symbol)

        daily_history = ticker.history(
            period="5d",
            auto_adjust=False,
        )

        intraday_history = ticker.history(
            period="1d",
            interval="1m",
            auto_adjust=False,
        )

        if daily_history.empty and intraday_history.empty:
            raise ValueError("No price history")

        latest = (
            intraday_history.iloc[-1]
            if not intraday_history.empty
            else daily_history.iloc[-1]
        )

        daily_latest = (
            daily_history.iloc[-1]
            if not daily_history.empty
            else latest
        )

        current_price = float(latest["Close"])

        previous_close = (
            float(daily_history["Close"].iloc[-2])
            if len(daily_history) > 1
            else current_price
        )

        price_change = current_price - previous_close

        change_percent = (
            (price_change / previous_close * 100)
            if previous_close
            else 0
        )

        try:
            info = ticker.info

            company_name = (
                info.get("longName")
                or info.get("shortName")
                or normalise_symbol(symbol, market)
            )

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
            "currency": (
                "INR"
                if market in {"NSE", "BSE"}
                else "USD"
                if market == "CRYPTO"
                else "PAIR"
            ),
            "currencySymbol": (
                "₹"
                if market in {"NSE", "BSE"}
                else "$"
                if market == "CRYPTO"
                else ""
            ),
            "dataStatus": "Auto-refreshing data; prices may be delayed.",
        }

    except Exception as error:
        raise HTTPException(
            status_code=404,
            detail=(
                f"'{symbol}' was not found in {market}. "
                "Check the symbol and try again."
            ),
        ) from error


# ============================================================
# STOCK HISTORY
# ============================================================

@app.get("/stocks/{symbol}/history")
def get_stock_history(
    symbol: str,
    market: Literal["NSE", "BSE", "CRYPTO", "FOREX"] = Query(
        default="NSE"
    ),
    period: str = Query(default="6mo"),
    interval: str = Query(default="1d"),
):
    clean_symbol = symbol.strip().upper()
    ticker_symbol = ticker_for_market(symbol, market)

    try:
        cached = get_price_history(
            clean_symbol,
            market,
            interval,
        )

        if cached:
            return {
                "symbol": ticker_symbol,
                "interval": interval,
                "candles": cached,
            }

        ticker = yf.Ticker(ticker_symbol)

        hist = ticker.history(
            period=period,
            interval=interval,
            auto_adjust=False,
        )

        if hist.empty:
            raise ValueError("No history")

        candles = []

        for idx, row in hist.iterrows():

            if row[["Open", "High", "Low", "Close"]].isna().any():
                continue

            candles.append(
                {
                    "time": int(idx.timestamp()),
                    "open": round(float(row["Open"]), 2),
                    "high": round(float(row["High"]), 2),
                    "low": round(float(row["Low"]), 2),
                    "close": round(float(row["Close"]), 2),
                    "volume": (
                        int(row["Volume"])
                        if pd.notna(row["Volume"])
                        else 0
                    ),
                }
            )

        if not candles:
            raise ValueError("No valid history rows")

        save_price_history(
            clean_symbol,
            market,
            interval,
            candles,
        )

        return {
            "symbol": ticker_symbol,
            "interval": interval,
            "candles": candles,
        }

    except Exception as error:
        print(
            f"[/history error] {symbol} {market}: {error}"
        )

        raise HTTPException(
            status_code=404,
            detail=f"No historical data for '{symbol}' in {market}.",
        ) from error


# ============================================================
# STOCK NEWS + FINBERT SENTIMENT
# ============================================================

@app.get("/stocks/{symbol}/news")
def get_stock_news(
    symbol: str,
    market: Literal["NSE", "BSE", "CRYPTO", "FOREX"] = Query(
        default="NSE"
    ),
):
    clean_symbol = symbol.strip().upper()

    cached = get_cached_news(
        clean_symbol,
        market,
    )

    if cached:
        return {
            "symbol": clean_symbol,
            "articles": cached,
        }

    ticker_symbol = ticker_for_market(
        symbol,
        market,
    )

    try:
        ticker = yf.Ticker(ticker_symbol)

        raw_news = ticker.news or []

        if not raw_news:
            return {
                "symbol": clean_symbol,
                "articles": [],
            }

        headlines = []

        for item in raw_news[:10]:

            content = (
                item.get("content", item)
                if isinstance(item, dict)
                else {}
            )

            title = (
                content.get("title")
                or item.get("title")
            )

            link = (
                ((content.get("canonicalUrl") or {}).get("url"))
                or item.get("link")
                or ""
            )

            pub_date = (
                content.get("pubDate")
                or content.get("displayTime")
                or ""
            )

            if title:
                headlines.append(
                    {
                        "title": title,
                        "link": link,
                        "pub_date": str(pub_date),
                    }
                )

        if not headlines:
            return {
                "symbol": clean_symbol,
                "articles": [],
            }

        pipe = get_sentiment_pipeline()

        results = pipe(
            [
                headline["title"]
                for headline in headlines
            ]
        )

        articles = []

        for headline, result in zip(
            headlines,
            results,
        ):
            articles.append(
                {
                    "title": headline["title"],
                    "link": headline["link"],
                    "published": headline["pub_date"],
                    "sentiment": result["label"],
                    "score": round(
                        float(result["score"]),
                        3,
                    ),
                }
            )

        save_news(
            clean_symbol,
            market,
            articles,
        )

        return {
            "symbol": clean_symbol,
            "articles": articles,
        }

    except Exception as error:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Could not fetch news for '{symbol}'."
            ),
        ) from error


# ============================================================
# AI PRICE PREDICTION
# ============================================================

@app.get("/stocks/{symbol}/predict")
def predict_stock(
    symbol: str,
    market: Literal["NSE", "BSE", "CRYPTO", "FOREX"] = Query(
        default="NSE"
    ),
    days: int = Query(
        default=5,
        ge=1,
        le=10,
    ),
):
    clean_symbol = symbol.strip().upper()

    ticker_symbol = ticker_for_market(
        symbol,
        market,
    )

    try:
        result = get_prediction(
            clean_symbol,
            market,
            ticker_symbol,
            days_ahead=days,
        )

        return {
            "symbol": clean_symbol,
            "market": market,
            **result,
        }

    except Exception as error:
        print(
            f"[/predict error] {symbol} {market}: {error}"
        )

        raise HTTPException(
            status_code=404,
            detail=(
                f"Could not generate a prediction "
                f"for '{symbol}'."
            ),
        ) from error


# ============================================================
# STOCKSENSE AI CHATBOT
# ============================================================

class ChatRequest(BaseModel):
    message: str
    symbol: str = "RELIANCE"
    market: Literal["NSE", "BSE", "CRYPTO", "FOREX"] = "NSE"


@app.post("/chat")
def stock_chat(request: ChatRequest):
    """
    Context-aware StockSense AI assistant.

    Uses StockSense's existing:
    - live market data
    - AI prediction model
    - FinBERT sentiment analysis

    No external AI API is required.
    """

    message = request.message.strip()

    message_lower = message.lower()

    if not message:
        return {
            "reply": (
                "Please ask me something about "
                "the market or the stock you're viewing."
            ),
            "type": "general",
        }

    symbol = request.symbol.strip().upper()
    market = request.market

    # --------------------------------------------------------
    # Greeting
    # --------------------------------------------------------

    greetings = {
        "hi",
        "hello",
        "hey",
        "hii",
        "helo",
        "good morning",
        "good afternoon",
        "good evening",
    }

    if message_lower in greetings or any(
        message_lower.startswith(
            greeting + " "
        )
        for greeting in greetings
    ):
        return {
            "reply": (
                f"Hello! 👋 I'm StockSense AI.\n\n"
                f"You're currently viewing "
                f"{symbol} on {market}.\n\n"
                f"You can ask me things like:\n"
                f"• What's the current price?\n"
                f"• Analyze this stock\n"
                f"• What's the AI prediction?\n"
                f"• What's the news sentiment?\n"
                f"• Is the stock moving up or down?"
            ),
            "type": "general",
        }

    # --------------------------------------------------------
    # Help
    # --------------------------------------------------------

    if (
        "help" in message_lower
        or "what can you do" in message_lower
    ):
        return {
            "reply": (
                "I can analyze the stock you're "
                "currently viewing using StockSense's "
                "market data and AI systems. 🤖\n\n"
                "Try asking:\n"
                "• Analyze this stock\n"
                "• Current price\n"
                "• Price prediction\n"
                "• News sentiment\n"
                "• Is it bullish or bearish?\n"
                "• Give me a market summary"
            ),
            "type": "help",
        }

    # --------------------------------------------------------
    # Current stock data
    # --------------------------------------------------------

    try:
        stock_data = get_stock(
            symbol,
            market,
        )

    except Exception:
        return {
            "reply": (
                f"I couldn't retrieve live data "
                f"for {symbol} on {market}. "
                f"Please check the symbol and try again."
            ),
            "type": "error",
        }

    company = stock_data["companyName"]

    price = stock_data["currentPrice"]

    change = stock_data["priceChange"]

    change_percent = stock_data["changePercent"]

    high = stock_data["high"]

    low = stock_data["low"]

    volume = stock_data["volume"]

    currency_symbol = stock_data["currencySymbol"]

    direction_word = (
        "gaining"
        if change >= 0
        else "losing"
    )

    # --------------------------------------------------------
    # Current price
    # --------------------------------------------------------

    price_keywords = [
        "current price",
        "price",
        "trading at",
        "worth",
        "how much",
        "what is the price",
        "what's the price",
    ]

    if any(
        keyword in message_lower
        for keyword in price_keywords
    ):
        return {
            "reply": (
                f"📊 **{company} ({symbol})**\n\n"
                f"Current price: "
                f"{currency_symbol}{price:,.2f}\n"
                f"Today's change: "
                f"{'+' if change >= 0 else ''}"
                f"{change:,.2f} "
                f"({change_percent:+.2f}%)\n\n"
                f"Day high: "
                f"{currency_symbol}{high:,.2f}\n"
                f"Day low: "
                f"{currency_symbol}{low:,.2f}\n"
                f"Volume: {volume:,}\n\n"
                f"The stock is currently "
                f"{direction_word} compared with "
                f"the previous close."
            ),
            "type": "price",
            "data": stock_data,
        }

    # --------------------------------------------------------
    # AI prediction
    # --------------------------------------------------------

    prediction_keywords = [
        "prediction",
        "predict",
        "forecast",
        "future",
        "tomorrow",
        "next 5 days",
        "next five days",
        "will it go up",
        "will it rise",
        "will it fall",
    ]

    if any(
        keyword in message_lower
        for keyword in prediction_keywords
    ):
        try:
            prediction = get_prediction(
                symbol,
                market,
                ticker_for_market(
                    symbol,
                    market,
                ),
                days_ahead=5,
            )

            predictions = prediction.get(
                "predictions",
                [],
            )

            prediction_text = ""

            if predictions:
                prediction_text = "\n".join(
                    [
                        f"Day {index + 1}: "
                        f"{currency_symbol}"
                        f"{float(value):,.2f}"
                        for index, value
                        in enumerate(predictions)
                    ]
                )

            if not prediction_text:
                prediction_text = (
                    "The prediction model did not "
                    "return forecast values."
                )

            return {
                "reply": (
                    f"🤖 **AI Prediction for "
                    f"{company}**\n\n"
                    f"Current price: "
                    f"{currency_symbol}"
                    f"{price:,.2f}\n\n"
                    f"Here is the model's "
                    f"5-day forecast:\n\n"
                    f"{prediction_text}\n\n"
                    f"⚠️ This is an AI-generated "
                    f"forecast based on historical "
                    f"market data and should not "
                    f"be treated as financial advice."
                ),
                "type": "prediction",
                "data": prediction,
            }

        except Exception:
            return {
                "reply": (
                    f"I couldn't generate the AI "
                    f"prediction for {symbol} right now. "
                    f"The live market data is still "
                    f"available."
                ),
                "type": "prediction_error",
            }

    # --------------------------------------------------------
    # News sentiment
    # --------------------------------------------------------

    sentiment_keywords = [
        "sentiment",
        "news",
        "news sentiment",
        "headlines",
        "market sentiment",
        "bullish",
        "bearish",
    ]

    if any(
        keyword in message_lower
        for keyword in sentiment_keywords
    ):
        try:
            news_data = get_stock_news(
                symbol,
                market,
            )

            articles = news_data.get(
                "articles",
                [],
            )

            if not articles:
                return {
                    "reply": (
                        f"I couldn't find recent news "
                        f"articles for {company} right now."
                    ),
                    "type": "sentiment",
                }

            positive = sum(
                1
                for article in articles
                if str(
                    article.get(
                        "sentiment",
                        "",
                    )
                ).upper()
                == "POSITIVE"
            )

            negative = sum(
                1
                for article in articles
                if str(
                    article.get(
                        "sentiment",
                        "",
                    )
                ).upper()
                == "NEGATIVE"
            )

            neutral = (
                len(articles)
                - positive
                - negative
            )

            if positive > negative:
                overall = "Positive 🟢"

            elif negative > positive:
                overall = "Negative 🔴"

            else:
                overall = "Mixed 🟡"

            headlines = "\n".join(
                [
                    f"• {article['title']}"
                    for article in articles[:5]
                ]
            )

            return {
                "reply": (
                    f"📰 **News Sentiment for "
                    f"{company}**\n\n"
                    f"Overall sentiment: "
                    f"**{overall}**\n\n"
                    f"Positive: {positive}\n"
                    f"Negative: {negative}\n"
                    f"Neutral: {neutral}\n\n"
                    f"Recent headlines:\n"
                    f"{headlines}\n\n"
                    f"Sentiment is generated "
                    f"using FinBERT."
                ),
                "type": "sentiment",
                "data": news_data,
            }

        except Exception:
            return {
                "reply": (
                    f"I couldn't retrieve the latest "
                    f"news sentiment for {symbol} "
                    f"right now."
                ),
                "type": "sentiment_error",
            }

    # --------------------------------------------------------
    # Full stock analysis
    # --------------------------------------------------------

    analysis_keywords = [
        "analyze",
        "analysis",
        "summary",
        "market summary",
        "stock analysis",
        "what do you think",
        "overview",
        "should i buy",
        "buy or sell",
        "bullish or bearish",
    ]

    if any(
        keyword in message_lower
        for keyword in analysis_keywords
    ):
        try:
            prediction = get_prediction(
                symbol,
                market,
                ticker_for_market(
                    symbol,
                    market,
                ),
                days_ahead=5,
            )

            predictions = prediction.get(
                "predictions",
                [],
            )

            forecast_direction = (
                "upward"
                if predictions
                and float(predictions[-1]) > price
                else "downward"
            )

        except Exception:
            forecast_direction = "unavailable"

        market_direction = (
            "Positive momentum 🟢"
            if change >= 0
            else "Negative momentum 🔴"
        )

        return {
            "reply": (
                f"🧠 **StockSense AI Analysis**\n\n"
                f"**{company} ({symbol})**\n\n"
                f"Current price: "
                f"{currency_symbol}"
                f"{price:,.2f}\n"
                f"Today's movement: "
                f"{change_percent:+.2f}%\n"
                f"Market momentum: "
                f"{market_direction}\n\n"
                f"Day range:\n"
                f"High: "
                f"{currency_symbol}"
                f"{high:,.2f}\n"
                f"Low: "
                f"{currency_symbol}"
                f"{low:,.2f}\n\n"
                f"AI forecast direction: "
                f"**{forecast_direction}**\n\n"
                f"📌 StockSense combines live "
                f"market data, historical prices, "
                f"AI prediction and financial news "
                f"sentiment to provide this analysis.\n\n"
                f"⚠️ This information is for "
                f"educational purposes and is not "
                f"financial advice."
            ),
            "type": "analysis",
            "data": stock_data,
        }

    # --------------------------------------------------------
    # Fallback
    # --------------------------------------------------------

    return {
        "reply": (
            f"I'm currently focused on "
            f"**{company} ({symbol})**.\n\n"
            f"I can help with:\n"
            f"📊 Current price and market movement\n"
            f"🤖 AI price prediction\n"
            f"📰 News sentiment\n"
            f"🧠 Stock analysis\n\n"
            f"Try asking: "
            f"**\"Analyze this stock\"**"
        ),
        "type": "general",
    }