export default function Toast({ message, tone = 'cyan', onClose }) {
  if (!message) return null;

  const tones = {
    cyan: 'border-cyan-300/30 bg-cyan-500/15 text-cyan-50',
    green: 'border-green-300/30 bg-green-500/15 text-green-50',
    red: 'border-red-300/30 bg-red-500/15 text-red-50',
    orange: 'border-orange-300/30 bg-orange-500/15 text-orange-50'
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
