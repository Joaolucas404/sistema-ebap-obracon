const STATUS_TONE = {
  valido: 'border-green-300/40 bg-green-500/20 text-green-100',
  liberada: 'border-green-300/40 bg-green-500/20 text-green-100',
  encerrada: 'border-green-300/40 bg-green-500/20 text-green-100',
  vencendo: 'border-orange-300/40 bg-orange-500/20 text-orange-100',
  em_analise: 'border-orange-300/40 bg-orange-500/20 text-orange-100',
  rascunho: 'border-slate-300/30 bg-slate-400/15 text-slate-200',
  pendente: 'border-cyan-300/35 bg-cyan-500/15 text-cyan-100',
  vencido: 'border-red-300/40 bg-red-500/20 text-red-100',
  reprovada: 'border-red-300/40 bg-red-500/20 text-red-100',
  cancelada: 'border-red-300/40 bg-red-500/20 text-red-100',
  dispensado: 'border-blue-300/35 bg-blue-500/15 text-blue-100'
};

export default function SstStatusBadge({ status }) {
  const label = String(status || '-').replaceAll('_', ' ');
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${STATUS_TONE[status] || STATUS_TONE.pendente}`}>
      {label}
    </span>
  );
}
