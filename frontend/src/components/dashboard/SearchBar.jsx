import { Search } from "lucide-react";

export default function SearchBar({
  symbol,
  setSymbol,
  onSearch,
}) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8">

      <input
        type="text"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSearch();
          }
        }}
        placeholder="Search AAPL, TSLA, MSFT..."
        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-5 py-3 outline-none focus:border-blue-500"
      />

      <button
        onClick={onSearch}
        className="bg-blue-600 hover:bg-blue-700 rounded-xl px-6 py-3 flex items-center justify-center gap-2 transition"
      >
        <Search size={18}/>
        Search
      </button>

    </div>
  );
}