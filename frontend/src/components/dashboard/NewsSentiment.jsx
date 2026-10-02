import { useEffect, useState } from 'react';
import { fetchStockNews } from '../../services/api';

const SENTIMENT_STYLES = {
  positive: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
  negative: 'bg-rose-400/15 text-rose-300 border-rose-400/30',
  neutral: 'bg-slate-400/15 text-slate-300 border-slate-400/30',
};

export default function NewsSentiment({ symbol, market }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadNews = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await fetchStockNews(symbol, market);

        if (!cancelled) setArticles(data.articles || []);
      } catch {
        if (!cancelled) setError('Could not load news for this symbol.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (symbol) loadNews();

    return () => {
      cancelled = true;
    };
  }, [symbol, market]);

  const overallScore = articles.length
    ? articles.reduce(
        (sum, a) =>
          sum +
          (a.sentiment === 'positive'
            ? a.score
            : a.sentiment === 'negative'
            ? -a.score
            : 0),
        0
      ) / articles.length
    : 0;

  const overallLabel =
    overallScore > 0.1
      ? 'Bullish'
      : overallScore < -0.1
      ? 'Bearish'
      : 'Neutral';

  const overallClass =
    overallScore > 0.1
      ? 'text-emerald-300'
      : overallScore < -0.1
      ? 'text-rose-300'
      : 'text-slate-300';

  return (
    <div className="p-6 bg-slate-900/80 border border-cyan-400/15 rounded-2xl shadow-lg shadow-slate-950/20 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <span>📰</span> News Sentiment
        </h3>

        {articles.length > 0 && (
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full border ${overallClass} border-current/30 bg-current/10`}
          >
            {overallLabel}
          </span>
        )}
      </div>

      {loading && (
        <p className="text-xs text-slate-500">
          Analyzing recent headlines…
        </p>
      )}

      {error && <p className="text-xs text-rose-300">{error}</p>}

      {!loading && !error && articles.length === 0 && (
        <p className="text-xs text-slate-500">
          No recent news found for this symbol.
        </p>
      )}

      <div className="space-y-3 overflow-y-auto max-h-64">
        {articles.map((a, i) => (
          <a
            key={i}
            href={a.link || '#'}
            target="_blank"
            rel="noreferrer"
            className="block p-3 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-cyan-400/30 transition-colors"
          >
            <p className="text-xs text-slate-200 leading-snug">
              {a.title}
            </p>

            <span
              className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                SENTIMENT_STYLES[a.sentiment] ||
                SENTIMENT_STYLES.neutral
              }`}
            >
              {a.sentiment?.toUpperCase()} · {(a.score * 100).toFixed(0)}%
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}