import { CheckCircle2, Eye, RotateCcw, XCircle } from 'lucide-react';
import CcoOsStatusBadge from './CcoOsStatusBadge.jsx';
import { areaLabel, prioridadeLabel } from '../../services/osService.js';

function formatDate(value) {
  return value ? new Date(value).toLocaleString('pt-BR') : '-';
}

export default function CcoOsCard({ os, canValidate, onDetail, onAction }) {
  return (
    <article className="glass-card rounded-3xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-black text-white">{os.numero}</h3>
            <CcoOsStatusBadge status={os.status} />
          </div>
          <p className="mt-1 font-bold text-slate-200">{os.titulo}</p>
          <p className="mt-1 line-clamp-2 text-sm text-slate-300">{os.descricao}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="secondary-button min-h-10 px-3" type="button" onClick={() => onDetail(os)}>
            <Eye size={16} />
            Detalhe
          </button>
          {canValidate && os.status === 'pendente_cco' && (
            <>
              <button className="primary-button min-h-10 px-3" type="button" onClick={() => onAction(os, 'aprovar')}>
                <CheckCircle2 size={16} />
                Aprovar
              </button>
              <button className="secondary-button min-h-10 px-3" type="button" onClick={() => onAction(os, 'corrigir')}>
                <RotateCcw size={16} />
                Corrigir
              </button>
              <button className="secondary-button min-h-10 border-red-300/35 bg-red-500/15 px-3 text-red-100" type="button" onClick={() => onAction(os, 'rejeitar')}>
                <XCircle size={16} />
                Rejeitar
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-5">
        <Info label="Origem" value={os.origem || '-'} />
        <Info label="EBAP" value={os.ebap?.nome || '-'} />
        <Info label="Area" value={areaLabel(os.area)} />
        <Info label="Prioridade" value={prioridadeLabel(os.prioridade)} />
        <Info label="Criada em" value={formatDate(os.created_at)} />
      </div>
    </article>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-cyan-300/10 bg-navy-950/35 p-3">
      <small className="font-black uppercase text-slate-400">{label}</small>
      <strong className="block truncate text-white">{value}</strong>
    </div>
  );
}
