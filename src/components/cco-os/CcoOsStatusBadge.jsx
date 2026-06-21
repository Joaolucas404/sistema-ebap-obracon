const tones = {
  pendente_cco: 'border-orange-300/40 bg-orange-500/15 text-orange-100',
  aprovada_cco: 'border-green-300/40 bg-green-500/15 text-green-100',
  rejeitada_cco: 'border-red-300/40 bg-red-500/15 text-red-100',
  correcao_solicitada_cco: 'border-cyan-300/40 bg-cyan-500/15 text-cyan-100'
};

export function ccoOsStatusLabel(status) {
  const labels = {
    pendente_cco: 'Pendente CCO',
    aprovada_cco: 'Aprovada CCO',
    rejeitada_cco: 'Rejeitada CCO',
    correcao_solicitada_cco: 'Correcao solicitada'
  };
  return labels[status] || String(status || '-').replaceAll('_', ' ');
}

export default function CcoOsStatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase ${tones[status] || tones.pendente_cco}`}>
      {ccoOsStatusLabel(status)}
    </span>
  );
}
