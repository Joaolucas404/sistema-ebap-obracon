export default function Toast({ message, tone = 'cyan', onClose }) {
  if (!message) return null;

  const tones = {
    cyan: 'border-cyan-300/30 bg-cyan-500/15 text-cyan-50',
    green: 'border-blue-300/30 bg-blue-500/15 text-blue-50',
    red: 'border-red-300/30 bg-red-500/15 text-red-50',
    orange: 'border-amber-300/30 bg-amber-500/15 text-amber-50'
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 max-w-sm rounded-2xl border px-4 py-3 text-sm font-bold shadow-2xl backdrop-blur-xl ${tones[tone] || tones.cyan}`}>
      <div className="flex items-start gap-3">
        <span className="leading-6">{message}</span>
        {onClose && (
          <button type="button" className="text-white/70 hover:text-white" onClick={onClose}>
            Fechar
          </button>
        )}
      </div>
    </div>
  );
}
