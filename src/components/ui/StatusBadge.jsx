export default function StatusBadge({ children, tone = 'cyan' }) {
  const tones = {
    cyan: 'border-cyan-300/30 bg-cyan-400/10 text-cyan-100',
    green: 'border-green-300/30 bg-green-400/10 text-green-100',
    orange: 'border-orange-300/30 bg-orange-400/10 text-orange-100',
    red: 'border-red-300/30 bg-red-400/10 text-red-100',
    slate: 'border-slate-300/20 bg-slate-400/10 text-slate-100'
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black ${tones[tone] || tones.cyan}`}>
      {children}
    </span>
  );
}
