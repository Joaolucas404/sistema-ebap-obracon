import { Edit3, PlayCircle } from 'lucide-react';
import ManutencaoStatusBadge from './ManutencaoStatusBadge.jsx';

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('pt-BR');
}

export default function PlanosManutencaoTable({ planos, canManage, onEdit, onExecute }) {
  if (!planos.length) {
    return <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-6 text-center text-slate-300">Nenhum plano de manutencao cadastrado.</div>;
  }

  return (
    <div className="grid gap-3">
      {planos.map((plano) => (
        <article key={plano.id} className="rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <ManutencaoStatusBadge value={plano.tipo} />
                <ManutencaoStatusBadge value={plano.prioridade} />
                <strong className="text-white">{plano.codigo}</strong>
              </div>
              <h3 className="mt-3 text-lg font-black text-white">{plano.nome}</h3>
              <p className="text-sm text-slate-300">{plano.ebap?.nome || 'Sem EBAP'} | {plano.equipamento?.nome || 'Sem equipamento'} | {plano.area}</p>
              <p className="mt-2 text-sm text-slate-400">Frequência: {plano.frequencia} | Próxima: {formatDate(plano.proxima_execucao)} | Responsável: {plano.responsavel?.nome || '-'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="secondary-button min-h-10" type="button" onClick={() => onExecute(plano)} disabled={!canManage}>
                <PlayCircle size={16} />
                Execução
              </button>
              <button className="secondary-button min-h-10" type="button" onClick={() => onEdit(plano)} disabled={!canManage}>
                <Edit3 size={16} />
                Editar
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
