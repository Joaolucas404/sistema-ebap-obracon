const tones = {
  OPERANDO: 'border-blue-300/40 bg-blue-500/15 text-blue-100',
  ATENCAO: 'border-yellow-300/40 bg-yellow-500/15 text-yellow-100',
  CRITICA: 'border-red-300/40 bg-red-500/15 text-red-100'
};

export default function EbapStatusBadge({ status }) {
  const labels = {
    OPERANDO: 'Operando',
    ATENCAO: 'Atencao',
    CRITICA: 'Critica'
  };

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase ${tones[status] || tones.OPERANDO}`}>
      {labels[status] || status || '-'}
    </span>
  );
}
