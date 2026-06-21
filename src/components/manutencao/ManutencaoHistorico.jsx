import { Link } from 'react-router-dom';
import ManutencaoStatusBadge from './ManutencaoStatusBadge.jsx';

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('pt-BR');
}

export default function ManutencaoHistorico({ execucoes }) {
  const grupos = [
    { key: 'concluida', label: 'Executadas', rows: execucoes.filter((item) => item.status === 'concluida') },
    { key: 'pendente', label: 'Pendentes', rows: execucoes.filter((item) => ['pendente', 'programada', 'em_execucao'].includes(item.status)) },
    { key: 'atrasada', label: 'Atrasadas', rows: execucoes.filter((item) => item.status === 'atrasada' || (item.data_programada < new Date().toISOString().slice(0, 10) && item.status !== 'concluida')) }
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {grupos.map((grupo) => (
        <section key={grupo.key} className="glass-card rounded-3xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-black text-white">{grupo.label}</h3>
            <span className="rounded-full border border-cyan-300/25 px-3 py-1 text-xs font-black text-cyan-100">{grupo.rows.length}</span>
          </div>
          <div className="grid gap-3">
            {grupo.rows.slice(0, 8).map((execucao) => (
              <article key={execucao.id} className="rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <ManutencaoStatusBadge value={execucao.status} />
                  <strong className="text-white">{execucao.plano?.codigo || 'Execucao'}</strong>
                </div>
                <p className="mt-2 text-sm text-slate-300">{execucao.plano?.nome || '-'} | {execucao.ebap?.nome || '-'}</p>
                <p className="mt-1 text-xs font-bold text-slate-400">Programada: {formatDate(execucao.data_programada)} | Executada: {formatDate(execucao.data_execucao)}</p>
                {execucao.os?.id && <Link className="mt-2 inline-block text-sm font-black text-cyan-100 hover:text-green-100" to={`/os/${execucao.os.id}`}>{execucao.os.numero}</Link>}
              </article>
            ))}
            {!grupo.rows.length && <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-4 text-sm text-slate-300">Sem registros.</div>}
          </div>
        </section>
      ))}
    </div>
  );
}
