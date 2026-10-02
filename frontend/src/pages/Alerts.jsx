import { useEffect, useState } from 'react';
import { fetchStockData } from '../services/api';
import { getAlerts, saveAlerts, newId } from '../utils/storage';

export default function Alerts() {
  const [alerts, setAlerts] = useState(getAlerts());
  const [form, setForm] = useState({ symbol: '', market: 'NSE', condition: 'above', targetPrice: '' });
  const [error, setError] = useState('');
  const [justTriggered, setJustTriggered] = useState([]);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleAdd = (e) => {
    e.preventDefault();
    const clean = form.symbol.trim().toUpperCase();
    const target = parseFloat(form.targetPrice);
    if (!clean || !target || target <= 0) {
      setError('Enter a valid symbol and target price.');
      return;
    }
    const updated = [
      ...alerts,
      { id: newId(), symbol: clean, market: form.market, condition: form.condition, targetPrice: target, triggered: false },
    ];
    setAlerts(updated);
    saveAlerts(updated);
    setForm({ ...form, symbol: '', targetPrice: '' });
    setError('');
  };

  const handleRemove = (id) => {
    const updated = alerts.filter((a) => a.id !== id);
    setAlerts(updated);
    saveAlerts(updated);
  };

  useEffect(() => {
    let cancelled = false;

    const checkAlerts = async () => {
      const active = alerts.filter((a) => !a.triggered);
      if (active.length === 0) return;

      const results = await Promise.all(
        active.map(async (a) => {
          try {
            const data = await fetchStockData(a.symbol, a.market);
            const hit =
              a.condition === 'above'
                ? data.currentPrice >= a.targetPrice
                : data.currentPrice <= a.targetPrice;
            return { id: a.id, hit, price: data.currentPrice };
          } catch {
            return { id: a.id, hit: false };
          }
        })
      );

      if (cancelled) return;

      const triggeredIds = results.filter((r) => r.hit).map((r) => r.id);
      if (triggeredIds.length > 0) {
        const updated = alerts.map((a) =>
          triggeredIds.includes(a.id) ? { ...a, triggered: true } : a
        );
        setAlerts(updated);
        saveAlerts(updated);
        setJustTriggered(updated.filter((a) => triggeredIds.includes(a.id)));
      }
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Price Alerts</h1>
        <p className="text-sm text-slate-400">Get notified when a symbol crosses your target price.</p>
      </div>

      {justTriggered.length > 0 && (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 space-y-1">
          {justTriggered.map((a) => (
            <p key={a.id} className="text-sm font-semibold text-amber-200">
              🔔 {a.symbol} hit your target ({a.condition} {a.targetPrice})
            </p>
          ))}
        </div>
      )}

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
          placeholder="Symbol"
          className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
        />
        <select
          value={form.condition}
          onChange={handleChange('condition')}
          className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm text-white outline-none"
        >
          <option value="above">Price ≥</option>
          <option value="below">Price ≤</option>
        </select>
        <input
          type="number"
          value={form.targetPrice}
          onChange={handleChange('targetPrice')}
          placeholder="Target Price"
          className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
        />
        <button
          type="submit"
          className="rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-300"
        >
          Create Alert
        </button>
      </form>

      {error && <p className="text-xs text-rose-300">{error}</p>}

      {alerts.length === 0 ? (
        <div className="rounded-2xl border border-cyan-400/15 bg-slate-900/80 p-8 text-center text-sm text-slate-400">
          No alerts set yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-cyan-400/15 bg-slate-900/80">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Symbol</th>
                <th className="px-5 py-3">Condition</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a.id} className="border-b border-slate-800/60 last:border-0">
                  <td className="px-5 py-3 font-semibold text-white">{a.symbol}<span className="ml-2 text-xs text-slate-500">{a.market}</span></td>
                  <td className="px-5 py-3 text-slate-300">{a.condition === 'above' ? '≥' : '≤'} {a.targetPrice}</td>
                  <td className="px-5 py-3">
                    {a.triggered ? (
                      <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-xs font-bold text-amber-300">Triggered</span>
                    ) : (
                      <span className="rounded-full bg-cyan-400/15 px-2.5 py-1 text-xs font-bold text-cyan-300">Watching</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleRemove(a.id)}
                      className="text-xs font-semibold text-rose-300 hover:text-rose-200"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}