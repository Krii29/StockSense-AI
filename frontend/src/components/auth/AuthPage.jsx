import { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Newspaper,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';

export default function AuthPage({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email || !password || (!isLogin && !name)) {
      alert('Please fill in all fields');
      return;
    }

    onLoginSuccess({
      name: isLogin ? email.split('@')[0] : name,
      email,
    });
  };

  const switchMode = (loginMode) => {
    setIsLogin(loginMode);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050914] text-slate-100">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-10 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[140px]" />
        <div className="absolute right-0 top-1/3 h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[160px]" />
        <div className="absolute bottom-[-250px] left-1/3 h-[500px] w-[500px] rounded-full bg-purple-600/8 blur-[150px]" />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(148,163,184,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.8) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* Decorative market chart */}
      <div className="pointer-events-none absolute left-[34%] top-[8%] hidden h-[80%] w-[30%] overflow-hidden opacity-20 lg:block">
        <svg
          viewBox="0 0 500 700"
          className="h-full w-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" x2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          <path
            d="M-20 560 C40 510 65 535 110 470 C155 405 165 450 215 370 C265 290 290 340 325 250 C365 155 390 210 435 125 C460 80 490 65 530 25"
            fill="none"
            stroke="url(#chartGradient)"
            strokeWidth="3"
          />

          <path
            d="M-20 565 C40 515 65 540 110 475 C155 410 165 455 215 375 C265 295 290 345 325 255 C365 160 390 215 435 130 C460 85 490 70 530 30 L530 700 L-20 700 Z"
            fill="url(#chartGradient)"
            opacity="0.12"
          />

          {[90, 150, 210, 270, 330, 390].map((x, index) => (
            <g key={x} opacity="0.7">
              <line
                x1={x}
                y1={520 - index * 55}
                x2={x}
                y2={580 - index * 55}
                stroke="#22d3ee"
                strokeWidth="4"
              />
              <line
                x1={x - 8}
                y1={535 - index * 55}
                x2={x + 8}
                y2={535 - index * 55}
                stroke="#22d3ee"
                strokeWidth="3"
              />
            </g>
          ))}
        </svg>
      </div>

      {/* Main content */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1500px] items-center px-6 py-10 sm:px-10 lg:px-14">
        <div className="grid w-full items-center gap-14 lg:grid-cols-[1fr_500px] lg:gap-16 xl:grid-cols-[1fr_540px]">
          
          {/* LEFT SIDE */}
          <section className="hidden lg:block">
            {/* Brand */}
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-700 shadow-[0_0_35px_rgba(6,182,212,0.3)]">
                <Zap className="h-7 w-7 fill-yellow-300 text-yellow-300" />
              </div>

              <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-white xl:text-5xl">
                  StockSense{' '}
                  <span className="bg-gradient-to-r from-cyan-300 to-blue-500 bg-clip-text text-transparent">
                    AI
                  </span>
                </h1>
                <p className="mt-1 text-sm font-medium tracking-[0.28em] text-slate-500">
                  INTELLIGENCE BEHIND EVERY INVESTMENT
                </p>
              </div>
            </div>

            {/* Hero heading */}
            <div className="max-w-2xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
                AI-powered market intelligence
              </p>

              <h2 className="text-5xl font-bold leading-[1.08] tracking-tight text-white xl:text-6xl">
                Intelligence Behind
                <br />
                Every{' '}
                <span className="bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Investment.
                </span>
              </h2>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">
                Analyze markets, understand financial sentiment, and turn
                complex market data into intelligent, data-driven insights.
              </p>
            </div>

            {/* Feature cards */}
            <div className="mt-10 grid max-w-2xl gap-3">
              <FeatureCard
                icon={<TrendingUp className="h-6 w-6" />}
                iconClass="bg-cyan-500/10 text-cyan-300 border-cyan-400/20"
                title="AI Predictions"
                description="AI-powered stock forecasting using advanced machine learning."
              />

              <FeatureCard
                icon={<Newspaper className="h-6 w-6" />}
                iconClass="bg-purple-500/10 text-purple-300 border-purple-400/20"
                title="Market Sentiment"
                description="Understand financial news with intelligent sentiment analysis."
              />

              <FeatureCard
                icon={<BrainCircuit className="h-6 w-6" />}
                iconClass="bg-emerald-500/10 text-emerald-300 border-emerald-400/20"
                title="Intelligent Insights"
                description="Turn market data into actionable investment intelligence."
              />
            </div>

            {/* Bottom benefits */}
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 border-t border-slate-800/70 pt-6 text-sm text-slate-400">
              <Benefit
                icon={<ShieldCheck className="h-4 w-4 text-cyan-400" />}
                text="Reliable Data"
              />
              <Benefit
                icon={<Sparkles className="h-4 w-4 text-blue-400" />}
                text="AI Powered"
              />
              <Benefit
                icon={<BarChart3 className="h-4 w-4 text-purple-400" />}
                text="Real-time Insights"
              />
              <Benefit
                icon={<LockKeyhole className="h-4 w-4 text-emerald-400" />}
                text="Secure & Private"
              />
            </div>
          </section>

          {/* RIGHT SIDE LOGIN CARD */}
          <section className="w-full">
            <div className="relative overflow-hidden rounded-[28px] border border-cyan-400/20 bg-[#0a1220]/90 p-7 shadow-[0_30px_100px_rgba(0,0,0,0.5),0_0_60px_rgba(6,182,212,0.07)] backdrop-blur-2xl sm:p-9">
              {/* Card glow */}
              <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-32 -left-20 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl" />

              <div className="relative z-10">
                {/* Mobile brand */}
                <div className="mb-7 flex items-center justify-center gap-3 lg:hidden">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/20">
                    <Zap className="h-5 w-5 fill-yellow-300 text-yellow-300" />
                  </div>

                  <h1 className="text-2xl font-bold text-white">
                    StockSense{' '}
                    <span className="text-cyan-400">AI</span>
                  </h1>
                </div>

                {/* Login logo */}
                <div className="mb-5 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-700 shadow-[0_0_30px_rgba(6,182,212,0.25)]">
                    <Zap className="h-7 w-7 fill-yellow-300 text-yellow-300" />
                  </div>

                  <h3 className="mt-4 text-2xl font-bold text-white">
                    StockSense{' '}
                    <span className="text-cyan-400">AI</span>
                  </h3>

                  <h2 className="mt-5 text-3xl font-bold tracking-tight text-white">
                    {isLogin ? 'Welcome back' : 'Create your account'}
                  </h2>

                  <p className="mt-2 text-sm text-slate-400">
                    {isLogin
                      ? 'Sign in to continue to your intelligent dashboard'
                      : 'Create your account and start exploring the market'}
                  </p>
                </div>

                {/* Login / Register toggle */}
                <div className="mb-7 flex rounded-xl border border-slate-700/70 bg-[#050a13] p-1">
                  <button
                    type="button"
                    onClick={() => switchMode(true)}
                    className={`flex-1 rounded-lg py-3 text-sm font-semibold transition-all duration-200 ${
                      isLogin
                        ? 'bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>

                  <button
                    type="button"
                    onClick={() => switchMode(false)}
                    className={`flex-1 rounded-lg py-3 text-sm font-semibold transition-all duration-200 ${
                      !isLogin
                        ? 'bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Register
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {!isLogin && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Full name
                      </label>

                      <div className="relative">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Krishang"
                          className="w-full rounded-xl border border-slate-700 bg-[#060c16] px-4 py-3.5 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/5"
                        />
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Email address
                    </label>

                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@stocksense.ai"
                        className="w-full rounded-xl border border-slate-700 bg-[#060c16] py-3.5 pl-11 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/5"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Password
                    </label>

                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full rounded-xl border border-slate-700 bg-[#060c16] py-3.5 pl-11 pr-12 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/5"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:text-slate-200"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember / Forgot */}
                  {isLogin && (
                    <div className="flex items-center justify-between gap-3">
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-400">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="h-4 w-4 cursor-pointer accent-cyan-400"
                        />
                        Remember me
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          alert('Password reset is not configured yet.')
                        }
                        className="text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 py-4 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-500/15 transition-all duration-200 hover:-translate-y-0.5 hover:from-cyan-300 hover:to-blue-500 hover:shadow-cyan-500/25 active:translate-y-0"
                  >
                    {isLogin ? 'Sign In' : 'Create Account'}

                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </button>
                </form>

                {/* Bottom prompt */}
                <div className="mt-7 text-center text-sm text-slate-500">
                  {isLogin ? (
                    <>
                      Don&apos;t have an account?{' '}
                      <button
                        type="button"
                        onClick={() => switchMode(false)}
                        className="font-semibold text-cyan-400 transition hover:text-cyan-300"
                      >
                        Create one
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => switchMode(true)}
                        className="font-semibold text-cyan-400 transition hover:text-cyan-300"
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </div>

                {/* Security note */}
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-600">
                  <LockKeyhole className="h-3.5 w-3.5" />
                  Your information stays private and secure
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, iconClass, title, description }) {
  return (
    <div className="group flex max-w-2xl items-center gap-4 rounded-2xl border border-slate-800/80 bg-slate-950/35 p-4 backdrop-blur-sm transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/50">
      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border ${iconClass}`}
      >
        {icon}
      </div>

      <div>
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function Benefit({ icon, text }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span>{text}</span>
    </div>
  );
}