import { labelStatus } from '../../utils/labels.js';

const TONES = {
  preventiva: 'border-green-300/35 bg-green-500/15 text-green-100',
  preditiva: 'border-cyan-300/35 bg-cyan-500/15 text-cyan-100',
  corretiva: 'border-orange-300/35 bg-orange-500/15 text-orange-100',
  pendente: 'border-cyan-300/35 bg-cyan-500/15 text-cyan-100',
  programada: 'border-blue-300/35 bg-blue-500/15 text-blue-100',
  em_execucao: 'border-orange-300/35 bg-orange-500/15 text-orange-100',
  concluida: 'border-green-300/35 bg-green-500/15 text-green-100',
  atrasada: 'border-red-300/40 bg-red-500/20 text-red-100',
  cancelada: 'border-slate-300/25 bg-slate-400/15 text-slate-200',
  critica: 'border-red-300/40 bg-red-500/20 text-red-100'
};

export default function ManutencaoStatusBadge({ value }) {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${TONES[value] || TONES.pendente}`}>
      {labelStatus(value)}
    </span>
  );
}
