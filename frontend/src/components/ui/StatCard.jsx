import { ArrowRight } from 'lucide-react';

export default function StatCard({ title, value, change, changePercent, currencySymbol, icon, isPortfolio }) {
  const isPositive = !changePercent.startsWith('-');

  return (
    <div className={`bg-[#152033] p-6 rounded-3xl border border-[#1a2333] flex flex-col justify-between ${isPortfolio ? 'col-span-1' : ''}`}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        {icon ? (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isPortfolio ? 'bg-[#1eb7ff]/10 text-[#1eb7ff]' : 'bg-[#0a1221] text-gray-500'}`}>
            {icon}
          </div>
        ) : (
          <span className="text-gray-500 text-xs">MARKET TREND <span className={`font-bold ${isPositive ? 'text-[#00c853]' : 'text-[#ff3b3b]'}`}>{isPositive ? 'BULLISH' : 'BEARISH'}</span></span>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-white">
            {currencySymbol}{value.toLocaleString()}
          </p>
          <p className={`flex items-center gap-1.5 text-xs ${isPortfolio ? 'text-[#1eb7ff]' : isPositive ? 'text-[#00c853]' : 'text-[#ff3b3b]'}`}>
            <ArrowRight className="w-3.5 h-3.5 rotate-[-45deg]" />
            {change ? `${currencySymbol}${change.toLocaleString()}` : ''} ({changePercent}%)
          </p>
        </div>
        {/* Placeholder for small sparkline chart (can add later) */}
        {!isPortfolio && (
           <div className="w-24 h-12 relative">
             <div className="absolute inset-x-0 bottom-0 h-10 border-b border-[#1eb7ff] opacity-10"></div>
             {/* Mock trend line SVG */}
             <svg viewBox="0 0 100 50" className="w-full h-full stroke-current" style={{ color: isPositive ? '#00c853' : '#ff3b3b' }} fill="none" strokeWidth="2">
                <path d={isPositive ? "M0 40 Q 25 30, 50 10 T 100 5" : "M0 10 Q 25 20, 50 30 T 100 45"}/>
             </svg>
           </div>
        )}
      </div>
    </div>
  );
}
