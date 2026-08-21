import { Search, Bell, Moon, ChevronDown } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex items-center justify-between p-6 bg-[#0c1626] border-b border-[#1a2333]">
      <div className="relative flex-grow max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search stocks, news, reports..."
          className="w-full bg-[#152033] text-sm text-white pl-12 pr-16 py-3 rounded-xl border border-[#1a2333] focus:outline-none focus:border-[#1eb7ff]/50"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-600 bg-[#0a1221] px-2 py-1 rounded-md border border-[#1a2333]">
          Ctrl K
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2 text-gray-500 hover:text-white transition">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#ff3b3b] rounded-full"></span>
        </button>
        <button className="p-2 text-gray-500 hover:text-white transition">
          <Moon className="w-5 h-5" />
        </button>
        <div className="h-8 w-px bg-[#1a2333]"></div>
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="w-10 h-10 bg-[#1eb7ff]/20 text-[#1eb7ff] rounded-full flex items-center justify-center font-bold text-xl">K</div>
          <ChevronDown className="w-5 h-5 text-gray-500 group-hover:text-white transition" />
        </div>
      </div>
    </header>
  );
}
