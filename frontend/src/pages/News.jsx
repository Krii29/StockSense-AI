
import { useEffect, useState } from 'react';
import { fetchStockNews } from '../services/api';
import SearchBar from '../components/dashboard/SearchBar';

const DEFAULT_SYMBOLS = [
  { symbol: 'RELIANCE', market: 'NSE' },
  { symbol: 'TCS', market: 'NSE' },
  { symbol: 'INFY', market: 'NSE' },
  { symbol: 'HDFCBANK', market: 'NSE' },
  { symbol: 'SBIN', market: 'NSE' },
  { symbol: 'ITC', market: 'NSE' },
];

const SENTIMENT_STYLES = {
  positive: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
  negative: 'bg-rose-400/15 text-rose-300 border-rose-400/30',
  neutral: 'bg-slate-400/15 text-slate-300 border-slate-400/30',
};

const FILTERS = ['all', 'positive', 'negative', 'neutral'];

export default function News(props) {
  const initialMarket = props.initialMarket || 'NSE';

  const [market, setMarket] = useState(initialMarket);
  const [focusSymbol, setFocusSymbol] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(
    function () {
      let cancelled = false;

      const loadFeed = async function () {
        setLoading(true);
        setError('');

        const targets = focusSymbol
          ? [{ symbol: focusSymbol, market: market }]
          : DEFAULT_SYMBOLS;

        try {
          const results = await Promise.all(
            targets.map(async function (t) {
              try {
                const data = await fetchStockNews(t.symbol, t.market);
                const articles = data?.articles || [];

                return articles.map(function (a) {
                  return Object.assign({}, a, {
                    symbol: t.symbol,
                    market: t.market,
                  });
                });
              } catch (e) {
                return [];
              }
            })
          );

          if (cancelled) return;

          const merged = [].concat.apply([], results);

          setItems(merged);

          if (merged.length === 0) {
            setError(
              'No recent news found for the selected symbol(s).'
            );
          }
        } catch (e) {
          if (!cancelled) {
            setError(
              'Could not load news for the selected symbol(s).'
            );
            setItems([]);
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

      loadFeed();

      return function () {
        cancelled = true;
      };
    },
    [focusSymbol, market]
  );

  const filteredItems =
    filter === 'all'
      ? items
      : items.filter(function (a) {
          return a.sentiment === filter;
        });

  const sentimentCounts = {
    positive: 0,
    negative: 0,
    neutral: 0,
  };

  for (let i = 0; i < items.length; i++) {
    const s = items[i].sentiment;

    if (sentimentCounts[s] !== undefined) {
      sentimentCounts[s] += 1;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          News
        </h1>

        <p className="text-sm text-slate-400">
          {focusSymbol
            ? 'Latest headlines and sentiment for ' + focusSymbol
            : 'Latest headlines across major NSE stocks, scored by FinBERT sentiment.'}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-md flex-1">
          <SearchBar
            onSearch={function (sym) {
              setFocusSymbol(sym);
            }}
            market={market}
            onMarketChange={setMarket}
          />
        </div>

        {focusSymbol ? (
          <button
            onClick={function () {
              setFocusSymbol(null);
            }}
            className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 whitespace-nowrap"
          >
            Back to full feed
          </button>
        ) : null}
      </div>

      {!focusSymbol ? (
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5 text-center">
            <p className="text-xs text-slate-400">
              Positive
            </p>

            <p className="text-xl font-bold text-emerald-300">
              {sentimentCounts.positive}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-700 bg-slate-800/30 text-center">
            <p className="text-xs text-slate-400">
              Neutral
            </p>

            <p className="text-xl font-bold text-slate-300">
              {sentimentCounts.neutral}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-rose-400/20 bg-rose-400/5 text-center">
            <p className="text-xs text-slate-400">
              Negative
            </p>

            <p className="text-xl font-bold text-rose-300">
              {sentimentCounts.negative}
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex gap-2">
        {FILTERS.map(function (f) {
          const active = filter === f;

          return (
            <button
              key={f}
              onClick={function () {
                setFilter(f);
              }}
              className={
                active
                  ? 'px-3 py-1.5 rounded-full text-xs font-bold bg-cyan-400 text-slate-950'
                  : 'px-3 py-1.5 rounded-full text-xs font-bold bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              }
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-cyan-400/15 bg-slate-900/80 p-8 text-center text-sm text-slate-400">
          Loading and scoring headlines...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-cyan-400/15 bg-slate-900/80 p-8 text-center text-sm text-slate-400">
          No headlines match this filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map(function (a, i) {
            const style =
              SENTIMENT_STYLES[a.sentiment] ||
              SENTIMENT_STYLES.neutral;

            const score = Number(a.score) || 0;

            return (
              <a
                key={i}
                href={a.link || '#'}
                target="_blank"
                rel="noreferrer"
                className="block p-4 rounded-2xl bg-slate-900/80 border border-cyan-400/15 hover:border-cyan-400/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-cyan-300">
                    {a.symbol}
                  </span>

                  <span
                    className={
                      'text-[10px] font-bold px-2 py-0.5 rounded-full border ' +
                      style
                    }
                  >
                    {a.sentiment
                      ? a.sentiment.toUpperCase()
                      : 'NEUTRAL'}{' '}
                    - {Math.round(score * 100)}%
                  </span>
                </div>

                <p className="text-sm text-slate-200 leading-snug">
                  {a.title}
                </p>

                {a.published ? (
                  <p className="text-[11px] text-slate-500 mt-2">
                    {a.published}
                  </p>
                ) : null}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
