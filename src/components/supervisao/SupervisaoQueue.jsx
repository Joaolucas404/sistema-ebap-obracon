import { Link } from 'react-router-dom';
import StatusBadge from '../ui/StatusBadge.jsx';
import { areaLabel, prioridadeLabel, statusSupervisorLabel, statusSupervisorTone } from '../../services/supervisaoService.js';

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('pt-BR');
}

export default function SupervisaoQueue({ items, loading, onAction }) {
  if (loading) {
    return <section className="glass-card rounded-3xl p-8 text-center text-slate-300">Carregando fila da supervisão...</section>;
  }

  return (
    <section className="glass-card rounded-3xl p-4">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-xl font-black text-white">Fila de trabalho</h3>
          <p className="text-sm text-slate-300">OS roteadas por área, com programação, técnico e status da supervisão.</p>
        </div>
        <StatusBadge tone="cyan">{items.length} OS nesta página</StatusBadge>
      </div>

      <div className="overflow-auto">
        <table className="min-w-[1100px] w-full border-separate border-spacing-y-2 text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.12em] text-slate-400">
            <tr>
              <th className="px-3">OS</th>
              <th className="px-3">EBAP</th>
              <th className="px-3">Área</th>
              <th className="px-3">Prioridade</th>
              <th className="px-3">Fila</th>
              <th className="px-3">Programação</th>
              <th className="px-3">Equipe / técnico</th>
              <th className="px-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.length ? items.map((os) => (
              <tr key={os.id} className="align-top">
                <td className="rounded-l-2xl border-y border-l border-cyan-300/15 bg-navy-900/70 px-3 py-3">
                  <Link className="font-black text-cyan-100 hover:text-white" to={`/os/${os.id}`}>{os.numero}</Link>
                  <p className="mt-1 max-w-xs text-slate-300">{os.titulo}</p>
                  <small className="text-slate-500">{formatDate(os.created_at)}</small>
                </td>
                <td className="border-y border-cyan-300/15 bg-navy-900/70 px-3 py-3 text-slate-200">{os.ebap?.nome || '-'}</td>
                <td className="border-y border-cyan-300/15 bg-navy-900/70 px-3 py-3"><StatusBadge tone="cyan">{areaLabel(os.area)}</StatusBadge></td>
                <td className="border-y border-cyan-300/15 bg-navy-900/70 px-3 py-3">{prioridadeLabel(os.prioridade)}</td>
                <td className="border-y border-cyan-300/15 bg-navy-900/70 px-3 py-3"><StatusBadge tone={statusSupervisorTone(os.status_supervisor)}>{statusSupervisorLabel(os.status_supervisor)}</StatusBadge></td>
                <td className="border-y border-cyan-300/15 bg-navy-900/70 px-3 py-3 text-slate-200">
                  {formatDate(os.data_programada)}
                  <br />
                  <small className="text-slate-400">{os.hora_programada || '-'} • {os.turno || '-'}</small>
                </td>
                <td className="border-y border-cyan-300/15 bg-navy-900/70 px-3 py-3 text-slate-200">
                  {os.equipe || os.equipe_responsavel || 'A definir'}
                  <br />
                  <small className="text-slate-400">{os.tecnico?.nome || os.responsavel?.nome || 'Técnico a definir'}</small>
                </td>
                <td className="rounded-r-2xl border-y border-r border-cyan-300/15 bg-navy-900/70 px-3 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button className="secondary-button min-h-9 px-3 text-xs" type="button" onClick={() => onAction('confirmar', os)}>Confirmar área</button>
                    <button className="secondary-button min-h-9 px-3 text-xs" type="button" onClick={() => onAction('programar', os)}>Programar</button>
                    <button className="secondary-button min-h-9 px-3 text-xs" type="button" onClick={() => onAction('encaminhar', os)}>Técnicos</button>
                    <button className="secondary-button min-h-9 px-3 text-xs" type="button" onClick={() => onAction('validar', os)}>Validar</button>
                    <button className="danger-button min-h-9 px-3 text-xs" type="button" onClick={() => onAction('corrigir', os)}>Correção</button>
                    <button className="secondary-button min-h-9 px-3 text-xs" type="button" onClick={() => onAction('reencaminhar', os)}>Reencaminhar</button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={8} className="rounded-2xl border border-cyan-300/15 bg-navy-900/70 p-8 text-center font-bold text-slate-300">
                  Nenhuma OS encontrada para a área/filtro selecionado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
