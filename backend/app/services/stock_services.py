import yfinance as yf


def get_stock_data(symbol: str):

    stock = yf.Ticker(symbol)

    info = stock.info

    return {
        "symbol": symbol.upper(),
        "company": info.get("longName"),
        "price": info.get("currentPrice"),
        "high": info.get("dayHigh"),
        "low": info.get("dayLow"),
        "open": info.get("open"),
        "volume": info.get("volume"),
    }