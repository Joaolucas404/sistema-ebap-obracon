import { labelStatus } from '../../utils/labels.js';

const tones = {
  solicitada: 'border-cyan-300/40 bg-cyan-500/15 text-cyan-100',
  em_cotacao: 'border-yellow-300/40 bg-yellow-500/15 text-yellow-100',
  aguardando_aprovacao: 'border-orange-300/40 bg-orange-500/15 text-orange-100',
  aprovada: 'border-green-300/40 bg-green-500/15 text-green-100',
  reprovada: 'border-red-300/40 bg-red-500/15 text-red-100',
  comprada: 'border-blue-300/40 bg-blue-500/15 text-blue-100',
  recebida: 'border-emerald-300/40 bg-emerald-500/15 text-emerald-100',
  cancelada: 'border-slate-300/30 bg-slate-500/15 text-slate-100'
};

export function formatCompraStatus(status) {
  const labels = {
    solicitada: 'Solicitada',
    em_cotacao: 'Em cotação',
    aguardando_aprovacao: 'Aguardando aprovação',
    aprovada: 'Aprovada',
    reprovada: 'Reprovada',
    comprada: 'Comprada',
    recebida: 'Recebida',
    cancelada: 'Cancelada'
  };

  return labels[status] || labelStatus(status);
}

export default function CompraStatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase ${tones[status] || tones.solicitada}`}>
      {formatCompraStatus(status)}
    </span>
  );
}
