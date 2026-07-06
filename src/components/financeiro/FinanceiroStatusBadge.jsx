import { labelStatus } from '../../utils/labels.js';

const tones = {
  ativo: 'border-emerald-300/30 bg-emerald-500/15 text-emerald-100',
  aprovada: 'border-emerald-300/30 bg-emerald-500/15 text-emerald-100',
  aprovado: 'border-emerald-300/30 bg-emerald-500/15 text-emerald-100',
  paga: 'border-emerald-300/30 bg-emerald-500/15 text-emerald-100',
  pago: 'border-emerald-300/30 bg-emerald-500/15 text-emerald-100',
  pendente: 'border-amber-300/30 bg-amber-500/15 text-amber-100',
  enviada: 'border-cyan-300/30 bg-cyan-500/15 text-cyan-100',
  em_analise: 'border-cyan-300/30 bg-cyan-500/15 text-cyan-100',
  em_fiscalizacao: 'border-cyan-300/30 bg-cyan-500/15 text-cyan-100',
  rascunho: 'border-slate-300/30 bg-slate-500/15 text-slate-100',
  suspenso: 'border-orange-300/30 bg-orange-500/15 text-orange-100',
  glosada: 'border-red-300/30 bg-red-500/15 text-red-100',
  reprovada: 'border-red-300/30 bg-red-500/15 text-red-100',
  atrasado: 'border-red-300/30 bg-red-500/15 text-red-100',
  cancelado: 'border-red-300/30 bg-red-500/15 text-red-100',
  encerrado: 'border-blue-300/30 bg-blue-500/15 text-blue-100',
  ajuste_solicitado: 'border-purple-300/30 bg-purple-500/15 text-purple-100',
  nao_enviada: 'border-slate-300/30 bg-slate-500/15 text-slate-100'
};

export default function FinanceiroStatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black uppercase ${tones[status] || tones.rascunho}`}>
      {labelStatus(status)}
    </span>
  );
}
