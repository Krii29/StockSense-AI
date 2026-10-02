import { Search } from 'lucide-react';
import { useState } from 'react';

const marketHints = {
  NSE: 'RELIANCE, TCS',
  BSE: 'RELIANCE, TCS',
  CRYPTO: 'BTC, ETH, SOL',
  FOREX: 'USD/INR, EUR/USD',
};

export default function SearchBar({ onSearch, market, onMarketChange }) {
  const [term, setTerm] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (term.trim()) {
      onSearch(term.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex max-w-full overflow-x-auto rounded-xl bg-slate-950/70 p-1 ring-1 ring-white/10">
        {['NSE', 'BSE', 'CRYPTO', 'FOREX'].map((marketOption) => (
          <button key={marketOption} type="button" onClick={() => onMarketChange(marketOption)} aria-pressed={market === marketOption}
            className={`rounded-lg px-3 py-2 text-xs font-bold transition-all ${market === marketOption ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}>
            {marketOption}
          </button>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 items-center rounded-xl border border-slate-700 bg-slate-900/80 px-3 focus-within:border-cyan-400 focus-within:ring-4 focus-within:ring-cyan-400/10">
        <Search className="mr-2 h-4 w-4 shrink-0 text-cyan-300" aria-hidden="true" />
        <input type="search" value={term} onChange={(event) => setTerm(event.target.value)} placeholder={`Search ${market} (e.g. ${marketHints[market]})`}
          className="w-full bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-slate-500" />
        <button type="submit" className="ml-2 rounded-lg bg-cyan-400 px-3 py-1.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-300">Search</button>
      </div>
    </form>
  );
}
