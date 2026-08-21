import { useState } from 'react';

export default function AuthPage({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
      alert('Please fill in all fields');
      return;
    }

    // Pass user details to parent App component
    onLoginSuccess({
      name: isLogin ? email.split('@')[0] : name,
      email: email,
    });
  };

  return (
    <div className="min-h-screen bg-[#070c14] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#0e1726] border border-slate-800/80 rounded-3xl p-8 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white text-2xl mx-auto mb-3 shadow-lg shadow-cyan-500/20">
            ⚡
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            StockSense <span className="text-cyan-400">AI</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isLogin ? 'Sign in to access your intelligence dashboard' : 'Create an account to start tracking markets'}
          </p>
        </div>

        {/* Toggle Login / Register */}
        <div className="flex bg-[#070c14] p-1 rounded-xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              isLogin ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              !isLogin ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Krishang"
                className="w-full px-4 py-3 bg-[#070c14] border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@stocksense.ai"
              className="w-full px-4 py-3 bg-[#070c14] border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-[#070c14] border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-cyan-500/20 mt-2"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
