export default function StatsCard({ label, value, hint, trend, icon: Icon, accent = 'indigo' }) {
  const accentClass =
    {
      indigo: 'bg-indigo-50 text-indigo-600',
      emerald: 'bg-emerald-50 text-emerald-600',
      amber: 'bg-amber-50 text-amber-600',
      rose: 'bg-rose-50 text-rose-600',
    }[accent] || 'bg-indigo-50 text-indigo-600';

  return (
    <div className="card flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${accentClass}`}>
          {Icon ? <Icon className="h-4 w-4" /> : <span className="h-3 w-3 rounded-full bg-current" />}
        </div>
      </div>
      <p className="text-3xl font-semibold text-slate-900">{value}</p>
      {(trend || hint) && (
        <p className="text-xs text-slate-400">
          {trend && (
            <span className={trend.direction === 'up' ? 'font-medium text-emerald-600' : 'font-medium text-rose-600'}>
              {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
            </span>
          )}
          {trend && hint ? ' ' : ''}
          {hint}
        </p>
      )}
    </div>
  );
}
