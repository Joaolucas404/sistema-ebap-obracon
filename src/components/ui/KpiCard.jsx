export default function KpiCard({ icon: Icon, label, value, helper, tone = 'cyan' }) {
  const toneClasses = {
    cyan: 'border-blue-300/20 text-blue-100',
    green: 'border-blue-300/20 text-blue-100',
    orange: 'border-amber-300/25 text-amber-100',
    yellow: 'border-amber-300/25 text-amber-100',
    red: 'border-red-300/25 text-red-100',
    blue: 'border-blue-300/25 text-blue-100',
    indigo: 'border-indigo-300/25 text-indigo-100'
  };

  return (
    <div className={`metric-card ${toneClasses[tone] || toneClasses.cyan}`}>
      <div className="relative z-10 flex items-center gap-4">
        {Icon && (
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/10 text-current shadow-inner">
            <Icon size={22} />
          </span>
        )}
        <div className="min-w-0">
          <strong className="block text-3xl font-black leading-none text-white md:text-4xl">{value}</strong>
          <span className="mt-2 block truncate text-xs font-black uppercase tracking-[0.12em] text-slate-300">{label}</span>
          {helper && <small className="mt-1 block truncate text-xs font-semibold text-slate-400">{helper}</small>}
        </div>
      </div>
    </div>
  );
}
