import { useEffect, useState } from 'react';
import { fetchStockData } from './services/api';
import SearchBar from './components/dashboard/SearchBar';
import StatCard from './components/dashboard/StatCard';
import AuthPage from './components/auth/AuthPage';
import StockChart from './components/dashboard/StockChart';
import axios from 'axios';

export default function App() {
  const [user, setUser] = useState(null);
  const [stock, setStock] = useState(null);
  const [error, setError] = useState('');
  const [currentSymbol, setCurrentSymbol] = useState('RELIANCE');
  const [market, setMarket] = useState('NSE');
  const [chartData, setChartData] = useState({ candlesticks: [], volume: [] });
  const [chartRange, setChartRange] = useState('1M');
  const [indices, setIndices] = useState([]);

  // Handle User Login / Signup
  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  // Handle Logout
  const handleLogout = () => {
    setUser(null);
    setStock(null);
  };

  // Handle manual user search
  const handleSearch = (symbol) => {
    setCurrentSymbol(symbol);
  };

  // Auto-fetch and poll live updates
  useEffect(() => {
    if (!user || !currentSymbol) return;

    const loadStock = async () => {
      try {
        setError('');
        const data = await fetchStockData(currentSymbol, market);
        setStock(data);
      } catch {
        setError(`No result in ${market}. Try ${market === 'CRYPTO' ? 'BTC, ETH, or SOL' : market === 'FOREX' ? 'USD/INR or EUR/USD' : 'RELIANCE, TCS, INFY, or SBIN'}.`);
        setStock(null);
      }
    };

    // 1. Fetch immediately when logged in or searching
    loadStock();

    // 2. Poll every 5 seconds for continuous live price changes
    const interval = setInterval(() => {
      loadStock();
    }, 1000);

    // 3. Cleanup timer
    return () => clearInterval(interval);
  }, [user, currentSymbol, market]);

  useEffect(() => {
   if (!user || !currentSymbol) return;
   axios.get(`http://127.0.0.1:8000/stocks/${currentSymbol}/history`, { params: { market, range: chartRange } })
    .then(res => setChartData(res.data))
    .catch(() => setChartData({ candlesticks: [], volume: [] }));
  }, [user, currentSymbol, market, chartRange]);

  // Fetch real index snapshot (NIFTY 50 / SENSEX / BANK NIFTY), refresh every 30s
  useEffect(() => {
    if (!user) return;
    const loadIndices = () => {
      axios.get('http://127.0.0.1:8000/indices')
        .then(res => setIndices(res.data.indices || []))
        .catch(() => setIndices([]));
    };
    loadIndices();
    const interval = setInterval(loadIndices, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const isPositive = (stock?.priceChange ?? 0) >= 0;
  const movementClass = isPositive ? 'text-emerald-300' : 'text-rose-300';
  const movementSurface = isPositive
    ? 'bg-emerald-400/10 border-emerald-400/30'
    : 'bg-rose-400/10 border-rose-400/30';

  // If not logged in, render Login Page
  if (!user) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  // If logged in, render main Dashboard UI
  return (
    <div className="min-h-screen bg-[#06131b] text-slate-100 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#071a23] border-r border-cyan-400/10 p-6 flex flex-col justify-between hidden md:flex">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
              📈
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                StockSense <span className="text-cyan-400">AI</span>
              </h1>
              <p className="text-[10px] text-slate-400 tracking-wider">INTELLIGENCE BEHIND INVESTMENT</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {[
              { name: 'Dashboard', icon: '🏠', active: true },
              { name: 'Market Overview', icon: '📊' },
              { name: 'Watchlist', icon: '⭐' },
              { name: 'AI Insights', icon: '🤖', badge: 'New' },
              { name: 'News', icon: '📰' },
              { name: 'Portfolio', icon: '💼' },
              { name: 'Alerts', icon: '🔔' },
              { name: 'Settings', icon: '⚙️' },
            ].map((item) => (
              <a
                key={item.name}
                href="#"
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  item.active
                    ? 'bg-cyan-400/15 text-cyan-300 border border-cyan-400/30 shadow-lg shadow-cyan-950/20'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="bg-cyan-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </a>
            ))}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-3 bg-slate-900/70 rounded-2xl border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-bold uppercase">
              {user.name.charAt(0)}
            </div>
            <div className="text-xs">
              <p className="font-semibold text-white capitalize">{user.name}</p>
              <p className="text-slate-400">Premium Plan</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
          >
            🚪
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="px-5 py-4 lg:px-8 border-b border-cyan-400/10 bg-[#071a23]/85 backdrop-blur-md flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1 max-w-xl">
            <SearchBar onSearch={handleSearch} market={market} onMarketChange={setMarket} />
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:text-white">
              🔔
            </button>
            <button className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:text-white">
              🌙
            </button>
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-bold text-xs uppercase">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Dashboard Main View */}
        <main className="p-5 lg:p-8 space-y-7 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_88%_0%,rgba(6,182,212,0.13),transparent_28%),radial-gradient(circle_at_0%_100%,rgba(16,185,129,0.10),transparent_28%)]">
          {/* Welcome Header */}
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2 capitalize">
              Welcome back, {user.name} <span className="animate-bounce">👋</span>
            </h1>
            <p className="text-sm text-slate-400">{market} prices, market movement, and investment intelligence.</p>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {stock && (
            <>
              {/* Asset Title Bar */}
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between p-6 bg-gradient-to-br from-slate-900 via-[#0b2631] to-slate-900 border border-cyan-300/15 rounded-2xl shadow-xl shadow-cyan-950/20">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-extrabold text-white">{stock.companyName}</h2>
                    <span className="px-3 py-1 bg-cyan-400/10 border border-cyan-300/30 text-cyan-200 text-xs font-semibold rounded-full uppercase">
                      {stock.symbol}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{stock.market} • {stock.dataStatus}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-3xl font-black text-white">
                    {stock.currencySymbol}{stock.currentPrice?.toLocaleString()}
                  </p>
                  <span className={`inline-flex mt-1 text-xs font-bold ${movementClass} ${movementSurface} px-2.5 py-1 rounded-md border`}>
                    {isPositive ? '▲' : '▼'} {Math.abs(stock.priceChange).toLocaleString()} ({Math.abs(stock.changePercent).toFixed(2)}%)
                  </span>
                </div>
              </div>

              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                  title="Current Price"
                  value={stock.currentPrice}
                  currencySymbol={stock.currencySymbol}
                  icon="💰"
                  trend={isPositive ? 'up' : 'down'}
                />
                <StatCard
                  title="High"
                  value={stock.high}
                  currencySymbol={stock.currencySymbol}
                  icon="📈"
                  trend="up"
                />
                <StatCard
                  title="Low"
                  value={stock.low}
                  currencySymbol={stock.currencySymbol}
                  icon="📉"
                  trend="down"
                />
                <StatCard
                  title="Volume"
                  value={stock.volume?.toLocaleString()}
                  currencySymbol=""
                  icon="📦"
                />
              </div>

              <StockChart data={chartData} symbol={stock.symbol} range={chartRange} onRangeChange={setChartRange} indices={indices} />

              {/* Lower Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-6 bg-slate-900/80 border border-cyan-400/15 rounded-2xl min-h-[220px] flex flex-col justify-between shadow-lg shadow-slate-950/20">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <span>🤖</span> AI Market Insight
                    </h3>
                    <span className="text-[10px] bg-violet-400 text-violet-950 font-bold px-2 py-0.5 rounded-full">
                      AI READY
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed my-4">
                    {stock.symbol} is currently <strong className={movementClass}>{isPositive ? 'trading higher' : 'trading lower'}</strong> than its previous close. Use this live signal with technical indicators, news sentiment, and your risk profile before making an investment decision.
                  </p>
                  <button className="w-fit text-xs font-semibold px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-xl transition-all">
                    View Full AI Analysis
                  </button>
                </div>

                <div className="p-6 bg-slate-900/80 border border-cyan-400/15 rounded-2xl min-h-[220px] flex flex-col justify-between shadow-lg shadow-slate-950/20">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <span>📊</span> Indices Overview
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                      <span className="text-slate-400">NIFTY 50</span>
                      <span className="font-semibold text-emerald-400">23,350.65 (+1.69%)</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                      <span className="text-slate-400">SENSEX</span>
                      <span className="font-semibold text-emerald-400">76,620.35 (+1.69%)</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">BANK NIFTY</span>
                      <span className="font-semibold text-emerald-400">48,765.20 (+1.69%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}