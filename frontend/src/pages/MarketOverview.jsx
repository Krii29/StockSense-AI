import { useEffect, useState } from 'react';
import { fetchStockData } from '../services/api';

const WATCHLIST_SYMBOLS = [
  { symbol: 'RELIANCE', market: 'NSE' },
  { symbol: 'TCS', market: 'NSE' },
  { symbol: 'INFY', market: 'NSE' },
  { symbol: 'HDFCBANK', market: 'NSE' },
  { symbol: 'ICICIBANK', market: 'NSE' },
  { symbol: 'SBIN', market: 'NSE' },
  { symbol: 'ITC', market: 'NSE' },
  { symbol: 'LT', market: 'NSE' },
  { symbol: 'BHARTIARTL', market: 'NSE' },
  { symbol: 'KOTAKBANK', market: 'NSE' },
  { symbol: 'BTC', market: 'CRYPTO' },
  { symbol: 'ETH', market: 'CRYPTO' },
];

const INDICES = [
  { name: 'NIFTY 50', value: '23,350.65', change: '+1.32%', positive: true },
  { name: 'SENSEX', value: '76,620.35', change: '+1.25%', positive: true },
  { name: 'BANK NIFTY', value: '48,765.20', change: '+1.48%', positive: true },
];

export default function MarketOverview({ onSelectSymbol }) {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadAll = async () => {
      if (stocks.length === 0) setLoading(true);
      try {
        const results = await Promise.all(
          WATCHLIST_SYMBOLS.map(async (item) => {
            try {
              const data = await fetchStockData(item.symbol, item.market);
              return { ...item, data };
            } catch {
              return { ...item, data: null };
            }
          })
        );
        if (!cancelled) {
          setStocks(results.filter((r) => r.data !== null));
          setError(results.every((r) => r.data === null) ? 'Could not load market data right now.' : '');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadAll();
    const interval = setInterval(loadAll, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = [...stocks].sort((a, b) => b.data.changePercent - a.data.changePercent);
  const gainers = sorted.filter((s) => s.data.changePercent > 0).slice(0, 5);
  const losers = [...sorted].reverse().filter((s) => s.data.changePercent < 0).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Market Overview</h1>
        <p className="text-sm text-slate-400">Live snapshot of major NSE stocks and crypto, refreshed every 15s.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {INDICES.map((idx) => (
          <div key={idx.name} className="p-4 rounded-xl border border-cyan-400/15 bg-slate-900/80">
            <p className="text-xs text-slate-400">{idx.name}</p>
            <p className="text-lg font-bold text-white">{idx.value}</p>
            <span className={`text-xs font-semibold ${idx.positive ? 'text-emerald-300' : 'text-rose-300'}`}>
              {idx.change}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm">{error}</div>
      )}

      {loading && stocks.length === 0 ? (
        <div className="rounded-2xl border border-cyan-400/15 bg-slate-900/80 p-8 text-center text-sm text-slate-400">
          Loading market data…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-emerald-400/20 bg-slate-900/80 p-5">
              <h3 className="font-bold text-white flex items-center gap-2 mb-3">
                <span>📈</span> Top Gainers
              </h3>
              {gainers.length === 0 ? (
                <p className="text-xs text-slate-500">No gainers right now.</p>
              ) : (
                <div className="space-y-2">
                  {gainers.map((s) => (
                    <button
                      key={`${s.symbol}-${s.market}`}
                      onClick={() => onSelectSymbol?.(s.symbol, s.market)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800/60 text-left"
                    >
                      <span className="text-sm font-semibold text-white">{s.symbol}</span>
                      <span className="text-sm font-semibold text-emerald-300">
                        ▲ {s.data.changePercent.toFixed(2)}%
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-rose-400/20 bg-slate-900/80 p-5">
              <h3 className="font-bold text-white flex items-center gap-2 mb-3">
                <span>📉</span> Top Losers
              </h3>
              {losers.length === 0 ? (
                <p className="text-xs text-slate-500">No losers right now.</p>
              ) : (
                <div className="space-y-2">
                  {losers.map((s) => (
                    <button
                      key={`${s.symbol}-${s.market}`}
                      onClick={() => onSelectSymbol?.(s.symbol, s.market)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800/60 text-left"
                    >
                      <span className="text-sm font-semibold text-white">{s.symbol}</span>
                      <span className="text-sm font-semibold text-rose-300">
                        ▼ {Math.abs(s.data.changePercent).toFixed(2)}%
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-400/15 bg-slate-900/80 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3">Symbol</th>
                  <th className="px-5 py-3">Market</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Change</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((s) => {
                  const isPositive = s.data.changePercent >= 0;
                  return (
                    <tr
                      key={`${s.symbol}-${s.market}`}
                      onClick={() => onSelectSymbol?.(s.symbol, s.market)}
                      className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/40 cursor-pointer"
                    >
                      <td className="px-5 py-3 font-semibold text-white">{s.symbol}</td>
                      <td className="px-5 py-3 text-slate-400">{s.market}</td>
                      <td className="px-5 py-3 text-white">
                        {s.data.currencySymbol}{s.data.currentPrice?.toLocaleString()}
                      </td>
                      <td className={`px-5 py-3 font-semibold ${isPositive ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {isPositive ? '▲' : '▼'} {Math.abs(s.data.changePercent).toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}