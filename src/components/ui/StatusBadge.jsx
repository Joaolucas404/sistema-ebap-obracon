export default function StatusBadge({ children, tone = 'cyan', size = 'sm' }) {
  const tones = {
    cyan: 'border-cyan-300/30 bg-cyan-400/10 text-cyan-100',
    green: 'border-green-300/30 bg-green-400/10 text-green-100',
    orange: 'border-orange-300/30 bg-orange-400/10 text-orange-100',
    yellow: 'border-yellow-300/40 bg-yellow-400/15 text-yellow-100',
    red: 'border-red-300/30 bg-red-400/10 text-red-100',
    blue: 'border-blue-300/40 bg-blue-400/15 text-blue-100',
    slate: 'border-slate-300/20 bg-slate-400/10 text-slate-100'
  };
  const sizes = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-1.5 text-sm',
    lg: 'px-5 py-2 text-sm'
  };

  return (
    <span className={`inline-flex items-center rounded-full border font-black ${sizes[size] || sizes.sm} ${tones[tone] || tones.cyan}`}>
      {children}
    </span>
  );
}
