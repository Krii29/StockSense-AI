import { useEffect, useState } from 'react';
import { fetchStockData } from '../services/api';
import { getPortfolio, savePortfolio, newId } from '../utils/storage';

export default function Portfolio() {
  const [holdings, setHoldings] = useState(getPortfolio());
  const [form, setForm] = useState({ symbol: '', market: 'NSE', qty: '', buyPrice: '' });
  const [prices, setPrices] = useState({});
  const [error, setError] = useState('');

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleAdd = (e) => {
    e.preventDefault();
    const clean = form.symbol.trim().toUpperCase();
    const qty = parseFloat(form.qty);
    const buyPrice = parseFloat(form.buyPrice);
    if (!clean || !qty || qty <= 0 || !buyPrice || buyPrice <= 0) {
      setError('Enter a valid symbol, quantity, and buy price.');
      return;
    }
    const updated = [
      ...holdings,
      {
        id: newId(),
        symbol: clean,
        market: form.market,
        qty,
        buyPrice,
        buyDate: new Date().toISOString().slice(0, 10),
      },
    ];
    setHoldings(updated);
    savePortfolio(updated);
    setForm({ symbol: '', market: form.market, qty: '', buyPrice: '' });
    setError('');
  };

  const handleRemove = (id) => {
    const updated = holdings.filter((h) => h.id !== id);
    setHoldings(updated);
    savePortfolio(updated);
  };

  useEffect(() => {
    let cancelled = false;

    const loadPrices = async () => {
      const results = await Promise.all(
        holdings.map(async (h) => {
          try {
            const data = await fetchStockData(h.symbol, h.market);
            return [h.id, data];
          } catch {
            return [h.id, null];
          }
        })
      );
      if (!cancelled) setPrices(Object.fromEntries(results));
    };

    if (holdings.length > 0) {
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
  }, [holdings]);

  const totals = holdings.reduce(
    (acc, h) => {
      const data = prices[h.id];
      const invested = h.qty * h.buyPrice;
      const current = data ? h.qty * data.currentPrice : invested;
      acc.invested += invested;
      acc.current += current;
      return acc;
    },
    { invested: 0, current: 0 }
  );
  const totalPnl = totals.current - totals.invested;
  const totalPnlPct = totals.invested ? (totalPnl / totals.invested) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Portfolio</h1>
        <p className="text-sm text-slate-400">Log your holdings and track live profit/loss.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-cyan-400/15 bg-slate-900/80 p-4">
          <p className="text-xs text-slate-400">Total Invested</p>
          <p className="text-xl font-bold text-white">₹{totals.invested.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
        </div>
        <div className="rounded-xl border border-cyan-400/15 bg-slate-900/80 p-4">
          <p className="text-xs text-slate-400">Current Value</p>
          <p className="text-xl font-bold text-white">₹{totals.current.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
        </div>
        <div className={`rounded-xl border p-4 ${totalPnl >= 0 ? 'border-emerald-400/30 bg-emerald-500/10' : 'border-rose-400/30 bg-rose-500/10'}`}>
          <p className="text-xs text-slate-400">Total P&amp;L</p>
          <p className={`text-xl font-bold ${totalPnl >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
            {totalPnl >= 0 ? '+' : ''}₹{totalPnl.toLocaleString(undefined, { maximumFractionDigits: 2 })} ({totalPnlPct.toFixed(2)}%)
          </p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        <select
          value={form.market}
          onChange={handleChange('market')}
          className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm text-white outline-none"
        >
          {['NSE', 'BSE', 'CRYPTO', 'FOREX'].map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <input
          type="text"
          value={form.symbol}
          onChange={handleChange('symbol')}
          placeholder="Symbol e.g. TCS"
          className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
        />
        <input
          type="number"
          value={form.qty}
          onChange={handleChange('qty')}
          placeholder="Quantity"
          className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
        />
        <input
          type="number"
          value={form.buyPrice}
          onChange={handleChange('buyPrice')}
          placeholder="Buy Price"
          className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
        />
        <button
          type="submit"
          className="rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-300"
        >
          Add Holding
        </button>
      </form>

      {error && <p className="text-xs text-rose-300">{error}</p>}

      {holdings.length === 0 ? (
        <div className="rounded-2xl border border-cyan-400/15 bg-slate-900/80 p-8 text-center text-sm text-slate-400">
          No holdings yet. Add one above.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-cyan-400/15 bg-slate-900/80">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Symbol</th>
                <th className="px-5 py-3">Qty</th>
                <th className="px-5 py-3">Buy Price</th>
                <th className="px-5 py-3">Current Price</th>
                <th className="px-5 py-3">P&amp;L</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => {
                const data = prices[h.id];
                const invested = h.qty * h.buyPrice;
                const current = data ? h.qty * data.currentPrice : invested;
                const pnl = current - invested;
                const pnlPct = invested ? (pnl / invested) * 100 : 0;
                return (
                  <tr key={h.id} className="border-b border-slate-800/60 last:border-0">
                    <td className="px-5 py-3 font-semibold text-white">{h.symbol}<span className="ml-2 text-xs text-slate-500">{h.market}</span></td>
                    <td className="px-5 py-3 text-slate-300">{h.qty}</td>
                    <td className="px-5 py-3 text-slate-300">{data?.currencySymbol ?? '₹'}{h.buyPrice}</td>
                    <td className="px-5 py-3 text-white">{data ? `${data.currencySymbol}${data.currentPrice?.toLocaleString()}` : '—'}</td>
                    <td className={`px-5 py-3 font-semibold ${pnl >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} ({pnlPct.toFixed(2)}%)
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleRemove(h.id)}
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