import { Edit3 } from 'lucide-react';
import SstStatusBadge from './SstStatusBadge.jsx';

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('pt-BR');
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('pt-BR');
}

function Empty({ text }) {
  return <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-6 text-center text-slate-300">{text}</div>;
}

export function EpiTable({ epis, canEdit, onEdit }) {
  if (!epis.length) return <Empty text="Nenhum EPI cadastrado." />;

  return (
    <div className="overflow-auto">
      <table className="min-w-[820px] w-full border-collapse">
        <thead className="bg-navy-950/50 text-left text-xs uppercase tracking-wide text-slate-300">
          <tr>
            <th className="px-4 py-3">EPI</th>
            <th className="px-4 py-3">CA</th>
            <th className="px-4 py-3">Validade CA</th>
            <th className="px-4 py-3">Categoria</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Acoes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-cyan-300/10">
          {epis.map((epi) => (
            <tr key={epi.id} className="bg-navy-950/20">
              <td className="px-4 py-4"><strong className="block text-white">{epi.nome}</strong><span className="text-xs font-bold text-cyan-100">{epi.codigo}</span></td>
              <td className="px-4 py-4 text-sm text-slate-200">{epi.ca || '-'}</td>
              <td className="px-4 py-4 text-sm text-slate-200">{formatDate(epi.validade_ca)}</td>
              <td className="px-4 py-4 text-sm text-slate-200">{epi.categoria || '-'}</td>
              <td className="px-4 py-4"><SstStatusBadge status={epi.ativo ? 'valido' : 'cancelada'} /></td>
              <td className="px-4 py-4 text-right">
                <button className="secondary-button min-h-10 px-3" type="button" onClick={() => onEdit(epi)} disabled={!canEdit}>
                  <Edit3 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EntregasTable({ entregas }) {
  if (!entregas.length) return <Empty text="Nenhuma entrega de EPI registrada." />;

  return (
    <div className="grid gap-3">
      {entregas.map((entrega) => (
        <article key={entrega.id} className="rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <strong className="text-white">{entrega.epi?.nome || 'EPI'}</strong>
              <p className="text-sm text-slate-300">{entrega.quantidade} unidade(s) para {entrega.funcionario?.nome || '-'}</p>
              {entrega.observacoes && <p className="mt-2 text-sm text-slate-300">{entrega.observacoes}</p>}
            </div>
            <div className="text-sm font-bold text-slate-300">
              <div>Entrega: {formatDate(entrega.entregue_em)}</div>
              <div>Validade: {formatDate(entrega.validade_uso)}</div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function TreinamentosTable({ treinamentos, canEdit, onEdit }) {
  if (!treinamentos.length) return <Empty text="Nenhum treinamento cadastrado." />;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {treinamentos.map((treinamento) => (
        <article key={treinamento.id} className="rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <strong className="text-white">{treinamento.nome}</strong>
              <p className="text-sm text-slate-300">{treinamento.codigo} | {treinamento.norma || 'Sem norma'}</p>
              <p className="mt-2 text-sm text-slate-300">Validade: {treinamento.validade_meses || '-'} meses | Carga: {treinamento.carga_horaria || '-'}h</p>
            </div>
            <button className="secondary-button min-h-10 px-3" type="button" onClick={() => onEdit(treinamento)} disabled={!canEdit}>
              <Edit3 size={16} />
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

export function FuncionarioTreinamentosTable({ registros }) {
  if (!registros.length) return <Empty text="Nenhum treinamento vinculado a funcionario." />;

  return (
    <div className="grid gap-3">
      {registros.map((registro) => (
        <article key={registro.id} className="rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <SstStatusBadge status={registro.status} />
                <strong className="text-white">{registro.treinamento?.nome || 'Treinamento'}</strong>
              </div>
              <p className="mt-2 text-sm text-slate-300">{registro.funcionario?.nome || '-'} | Realizado: {formatDate(registro.realizado_em)}</p>
              {registro.observacoes && <p className="mt-2 text-sm text-slate-300">{registro.observacoes}</p>}
            </div>
            <div className="text-sm font-bold text-slate-300">Valido ate {formatDate(registro.valido_ate)}</div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function AprTable({ aprs, canEdit, onEdit }) {
  if (!aprs.length) return <Empty text="Nenhuma APR cadastrada." />;

  return (
    <div className="grid gap-3">
      {aprs.map((apr) => (
        <article key={apr.id} className="rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <SstStatusBadge status={apr.status} />
                <strong className="text-white">{apr.codigo}</strong>
              </div>
              <p className="mt-2 text-sm text-slate-200">{apr.atividade}</p>
              <p className="mt-1 text-sm text-slate-400">{apr.ebap?.nome || 'Sem EBAP'} | Responsavel: {apr.responsavel?.nome || '-'}</p>
              <p className="mt-1 text-xs font-bold text-cyan-100">Inicio: {formatDateTime(apr.inicio_previsto)} | Fim: {formatDateTime(apr.fim_previsto)}</p>
            </div>
            <button className="secondary-button min-h-10 px-3" type="button" onClick={() => onEdit(apr)} disabled={!canEdit}>
              <Edit3 size={16} />
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
