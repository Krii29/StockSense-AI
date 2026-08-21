import { Home, BarChart3, Star, BrainCircuit, FileText, BriefcaseBusiness, BellRing, Settings } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', icon: Home, active: true },
  { name: 'Market Overview', icon: BarChart3 },
  { name: 'Watchlist', icon: Star },
  { name: 'AI Insights', icon: BrainCircuit, badge: 'New' },
  { name: 'News', icon: FileText },
  { name: 'Portfolio', icon: BriefcaseBusiness },
  { name: 'Alerts', icon: BellRing },
  { name: 'Settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-[#0a1221] p-6 flex flex-col border-r border-[#1a2333]">
      <div className="flex items-center gap-3 mb-12">
        {/* Glow effect around logo */}
        <div className="relative">
          <div className="absolute -inset-1 bg-[#1eb7ff] rounded-full blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <img src="path/to/your/logo.png" alt="StockSense AI" className="relative w-10 h-10" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">StockSense <span className="text-[#1eb7ff]">AI</span></h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Intelligence Behind Every Investment.</p>
        </div>
      </div>

      <nav className="flex-grow space-y-1">
        {navItems.map((item) => (
          <a
            key={item.name}
            href="#"
            className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm transition-colors group ${
              item.active
                ? 'bg-[#152033] text-[#1eb7ff] font-semibold'
                : 'text-gray-400 hover:bg-[#152033] hover:text-white'
            }`}
          >
            <item.icon className={`w-5 h-5 ${item.active ? 'text-[#1eb7ff]' : 'text-gray-500 group-hover:text-white'}`} />
            <span>{item.name}</span>
            {item.badge && (
              <span className="ml-auto text-[10px] bg-[#1eb7ff] text-[#0a1221] px-2 py-0.5 rounded-full font-bold">
                {item.badge}
              </span>
            )}
          </a>
        ))}
      </nav>

      <div className="mt-12 p-4 bg-[#152033] rounded-2xl flex items-center gap-4 border border-[#1a2333]">
        <div className="w-10 h-10 bg-[#1eb7ff]/20 text-[#1eb7ff] rounded-full flex items-center justify-center font-bold text-xl">K</div>
        <div>
          <p className="text-sm font-semibold text-white">Krishang</p>
          <p className="text-xs text-[#1eb7ff]">Premium Plan</p>
        </div>
        <Settings className="ml-auto w-5 h-5 text-gray-500 cursor-pointer" />
      </div>
    </aside>
  );
}
