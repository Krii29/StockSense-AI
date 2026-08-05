import {
  LayoutDashboard,
  Briefcase,
  Star,
  BrainCircuit,
  Newspaper,
  Settings
} from "lucide-react";

export default function Sidebar() {
  const items = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: Briefcase, label: "Portfolio" },
    { icon: Star, label: "Watchlist" },
    { icon: BrainCircuit, label: "Prediction" },
    { icon: Newspaper, label: "News" },
    { icon: Settings, label: "Settings" },
  ];

  return (
    <aside className="w-64 h-screen bg-slate-900 border-r border-slate-800 p-6">

      <h1 className="text-2xl font-bold text-blue-500 mb-10">
        📈 AI Stocks
      </h1>

      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item.label}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition"
          >
            <item.icon size={20} />
            {item.label}
          </button>
        ))}
      </div>

    </aside>
  );
}