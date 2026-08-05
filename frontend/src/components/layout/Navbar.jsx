import { Bell, UserCircle } from "lucide-react";

export default function Navbar() {
  return (
    <header className="h-20 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8">

      <div>
        <h1 className="text-3xl font-bold text-white">
          AI Stock Market Analysis
        </h1>

        <p className="text-slate-400">
          Track stocks with AI-powered insights
        </p>
      </div>

      <div className="flex items-center gap-6">

        <button className="hover:text-blue-500 transition">
          <Bell size={24} />
        </button>

        <UserCircle
          size={38}
          className="text-blue-500"
        />

      </div>

    </header>
  );
}