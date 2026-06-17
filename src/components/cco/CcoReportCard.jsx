import { CheckCircle2, Eye, RotateCcw, XCircle } from 'lucide-react';
import CcoStatusBadge from './CcoStatusBadge.jsx';

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('pt-BR');
}

export default function CcoReportCard({ report, canValidate = false, onView, onValidate }) {
  const isPending = report.status === 'pendente_validacao_cco';

  return (
    <article className="glass-card rounded-3xl p-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <strong className="text-lg font-black text-white">{report.codigo}</strong>
            <CcoStatusBadge status={report.status} />
          </div>
          <h3 className="text-xl font-black text-white">{report.ebap?.nome || 'EBAP nao informada'}</h3>
          <p className="mt-1 text-sm text-slate-300">
            Operador: {report.operador?.nome || '-'} | Operacao: {formatDate(report.data_operacao)}
          </p>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-300">
            {report.resumo || report.ocorrencias || report.conclusao_operador || 'Sem ocorrencias descritas.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <button className="secondary-button" type="button" onClick={() => onView(report)}>
            <Eye size={17} />
            Abrir
          </button>
          {canValidate && isPending && (
            <>
              <button className="primary-button" type="button" onClick={() => onValidate('aprovar', report)}>
                <CheckCircle2 size={17} />
                Aprovar
              </button>
              <button className="secondary-button" type="button" onClick={() => onValidate('correcao', report)}>
                <RotateCcw size={17} />
                Correcao
              </button>
              <button className="danger-button" type="button" onClick={() => onValidate('rejeitar', report)}>
                <XCircle size={17} />
                Rejeitar
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
