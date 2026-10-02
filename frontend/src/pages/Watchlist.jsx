import { useEffect, useState } from 'react';
import { fetchStockData } from '../services/api';
import { getWatchlist, saveWatchlist, newId } from '../utils/storage';

export default function Watchlist() {
  const [items, setItems] = useState(getWatchlist());
  const [symbol, setSymbol] = useState('');
  const [market, setMarket] = useState('NSE');
  const [prices, setPrices] = useState({});
  const [error, setError] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    const clean = symbol.trim().toUpperCase();
    if (!clean) return;
    if (items.some((i) => i.symbol === clean && i.market === market)) {
      setError('Already in your watchlist.');
      return;
    }
    const updated = [...items, { id: newId(), symbol: clean, market }];
    setItems(updated);
    saveWatchlist(updated);
    setSymbol('');
    setError('');
  };

  const handleRemove = (id) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    saveWatchlist(updated);
  };

  useEffect(() => {
    let cancelled = false;

    const loadPrices = async () => {
      const results = await Promise.all(
        items.map(async (item) => {
          try {
            const data = await fetchStockData(item.symbol, item.market);
            return [item.id, data];
          } catch {
            return [item.id, null];
          }
        })
      );
      if (!cancelled) {
        setPrices(Object.fromEntries(results));
      }
    };

    if (items.length > 0) {
      loadPrices();
      const interval = setInterval(loadPrices, 10000);
      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [items]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Watchlist</h1>
        <p className="text-sm text-slate-400">Track symbols across NSE, BSE, Crypto, and Forex.</p>
      </div>

      <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={market}
          onChange={(e) => setMarket(e.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm text-white outline-none"
        >
          {['NSE', 'BSE', 'CRYPTO', 'FOREX'].map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="e.g. RELIANCE, BTC, USDINR"
          className="flex-1 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
        />
        <button
          type="submit"
          className="rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-300"
        >
          Add to Watchlist
        </button>
      </form>

      {error && <p className="text-xs text-rose-300">{error}</p>}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-cyan-400/15 bg-slate-900/80 p-8 text-center text-sm text-slate-400">
          Your watchlist is empty. Add a symbol above to start tracking it.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-cyan-400/15 bg-slate-900/80">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Symbol</th>
                <th className="px-5 py-3">Market</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Change</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const data = prices[item.id];
                const isPositive = (data?.priceChange ?? 0) >= 0;
                return (
                  <tr key={item.id} className="border-b border-slate-800/60 last:border-0">
                    <td className="px-5 py-3 font-semibold text-white">{item.symbol}</td>
                    <td className="px-5 py-3 text-slate-400">{item.market}</td>
                    <td className="px-5 py-3 text-white">
                      {data ? `${data.currencySymbol}${data.currentPrice?.toLocaleString()}` : '—'}
                    </td>
                    <td className={`px-5 py-3 font-semibold ${isPositive ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {data ? `${isPositive ? '▲' : '▼'} ${Math.abs(data.changePercent).toFixed(2)}%` : '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="text-xs font-semibold text-rose-300 hover:text-rose-200"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}