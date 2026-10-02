export default function StatCard({ title, value, currencySymbol = '$', icon, trend }) {
  const trendClass = trend === 'down' ? 'border-rose-400/30 bg-rose-500/10' : 'border-emerald-400/30 bg-emerald-500/10';
  return (
    <div className={`p-4 rounded-xl border ${trend ? trendClass : 'bg-slate-800 border-slate-700'} shadow-lg shadow-slate-950/20`}>
      <div className="flex items-center justify-between text-slate-400 mb-2">
        <span className="text-sm font-medium">{title}</span>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <h2 className={`text-2xl font-bold ${trend === 'down' ? 'text-rose-200' : trend === 'up' ? 'text-emerald-200' : 'text-white'}`}>
        {typeof value === 'number' ? `${currencySymbol}${value.toLocaleString()}` : value || 'N/A'}
      </h2>
    </div>
  );
}
