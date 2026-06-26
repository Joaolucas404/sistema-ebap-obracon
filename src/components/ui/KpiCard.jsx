export default function KpiCard({ icon: Icon, label, value, helper, tone = 'cyan' }) {
  const toneClasses = {
    cyan: 'from-cyan-400/20 to-blue-500/10 text-cyan-100',
    green: 'from-green-400/20 to-emerald-600/10 text-green-100',
    orange: 'from-orange-400/20 to-yellow-500/10 text-orange-100',
    yellow: 'from-yellow-300/25 to-amber-500/10 text-yellow-100',
    red: 'from-red-400/20 to-pink-600/10 text-red-100',
    blue: 'from-blue-400/20 to-cyan-500/10 text-blue-100'
  };

  return (
    <div className={`metric-card bg-gradient-to-br ${toneClasses[tone] || toneClasses.cyan}`}>
      <div className="relative z-10 flex items-center gap-3">
        {Icon && (
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/10 bg-navy-950/75 text-cyan-100 shadow-inner">
            <Icon size={24} />
          </span>
        )}
        <div className="min-w-0">
          <span className="block truncate text-xs font-black uppercase tracking-[0.12em] text-slate-300">{label}</span>
          <strong className="mt-1 block text-3xl font-black leading-none text-white md:text-4xl">{value}</strong>
          {helper && <small className="mt-2 block truncate text-xs font-semibold text-slate-300">{helper}</small>}
        </div>
      </div>
    </div>
  );
}
