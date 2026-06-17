export default function KpiCard({ icon: Icon, label, value, helper, tone = 'cyan' }) {
  const toneClasses = {
    cyan: 'border-cyan-300/25 text-cyan-100',
    green: 'border-green-300/25 text-green-100',
    orange: 'border-orange-300/25 text-orange-100',
    red: 'border-red-300/25 text-red-100',
    blue: 'border-blue-300/25 text-blue-100'
  };

  return (
    <div className={`glass-card rounded-2xl border p-4 ${toneClasses[tone] || toneClasses.cyan}`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-navy-950/70 text-cyan-200">
            <Icon size={24} />
          </span>
        )}
        <div>
          <span className="block text-xs font-black uppercase tracking-wide text-slate-300">{label}</span>
          <strong className="mt-1 block text-3xl font-black text-white">{value}</strong>
          {helper && <small className="text-slate-300">{helper}</small>}
        </div>
      </div>
    </div>
  );
}
