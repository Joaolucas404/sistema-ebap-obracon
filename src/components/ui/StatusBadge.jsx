export default function StatusBadge({ children, tone = 'cyan', size = 'sm' }) {
  const tones = {
    cyan: 'border-cyan-300/30 bg-cyan-400/10 text-cyan-100',
    green: 'border-blue-300/35 bg-blue-500/15 text-blue-100',
    orange: 'border-amber-300/30 bg-amber-400/10 text-amber-100',
    yellow: 'border-yellow-300/40 bg-yellow-400/15 text-yellow-100',
    red: 'border-red-300/30 bg-red-400/10 text-red-100',
    blue: 'border-blue-300/40 bg-blue-400/15 text-blue-100',
    indigo: 'border-indigo-300/35 bg-indigo-400/15 text-indigo-100',
    slate: 'border-slate-300/20 bg-slate-400/10 text-slate-100'
  };
  const sizes = {
    sm: 'px-3 py-1 text-[13px]',
    md: 'px-4 py-1.5 text-[13px]',
    lg: 'px-5 py-2 text-[13px]'
  };

  return (
    <span className={`ds-badge inline-flex items-center rounded-full border ${sizes[size] || sizes.sm} ${tones[tone] || tones.cyan}`}>
      {children}
    </span>
  );
}
