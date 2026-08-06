export default function StatsCard({ label, value, hint, accent = 'indigo' }) {
  const accentClass =
    {
      indigo: 'bg-indigo-50 text-indigo-600',
      emerald: 'bg-emerald-50 text-emerald-600',
      amber: 'bg-amber-50 text-amber-600',
    }[accent] || 'bg-indigo-50 text-indigo-600';

  return (
    <div className="card flex items-center justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      </div>
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full ${accentClass}`}
      >
        <span className="h-3 w-3 rounded-full bg-current" />
      </div>
    </div>
  );
}
