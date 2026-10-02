import sqlite3
import time
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "warehouse.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS price_history (
            symbol TEXT,
            market TEXT,
            interval TEXT,
            time INTEGER,
            open REAL,
            high REAL,
            low REAL,
            close REAL,
            volume INTEGER,
            PRIMARY KEY (symbol, market, interval, time)
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS news_sentiment (
            symbol TEXT,
            market TEXT,
            title TEXT,
            link TEXT,
            published TEXT,
            sentiment TEXT,
            score REAL,
            cached_at INTEGER,
            PRIMARY KEY (symbol, market, title)
        )
    """)
    conn.commit()
    conn.close()


def save_price_history(symbol, market, interval, rows):
    conn = get_connection()
    conn.executemany(
        """INSERT OR REPLACE INTO price_history
           (symbol, market, interval, time, open, high, low, close, volume)
           VALUES (?,?,?,?,?,?,?,?,?)""",
        [
            (symbol, market, interval, r["time"], r["open"], r["high"], r["low"], r["close"], r["volume"])
            for r in rows
        ],
    )
    conn.commit()
    conn.close()


def get_price_history(symbol, market, interval, max_age_seconds=3600):
    conn = get_connection()
    cur = conn.execute(
        "SELECT time, open, high, low, close, volume FROM price_history WHERE symbol=? AND market=? AND interval=? ORDER BY time ASC",
        (symbol, market, interval),
    )
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    if not rows:
        return []
    newest = rows[-1]["time"]
    if int(time.time()) - newest > max_age_seconds:
        return []  # stale, force a refresh
    return rows


def save_news(symbol, market, items):
    conn = get_connection()
    now = int(time.time())
    conn.executemany(
        """INSERT OR REPLACE INTO news_sentiment
           (symbol, market, title, link, published, sentiment, score, cached_at)
           VALUES (?,?,?,?,?,?,?,?)""",
        [
            (symbol, market, it["title"], it["link"], it["published"], it["sentiment"], it["score"], now)
            for it in items
        ],
    )
    conn.commit()
    conn.close()


def get_cached_news(symbol, market, max_age_seconds=1800):
    conn = get_connection()
    cutoff = int(time.time()) - max_age_seconds
    cur = conn.execute(
        "SELECT title, link, published, sentiment, score FROM news_sentiment WHERE symbol=? AND market=? AND cached_at >= ? ORDER BY cached_at DESC",
        (symbol, market, cutoff),
    )
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows