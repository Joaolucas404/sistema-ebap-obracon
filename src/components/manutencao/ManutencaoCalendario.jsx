import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import KpiCard from '../ui/KpiCard.jsx';
import { AlertTriangle, CalendarCheck2, Clock, PlayCircle } from 'lucide-react';
import {
  MANUTENCAO_AREAS,
  MANUTENCAO_CALENDARIO_STATUS,
  equipesPorArea,
  equipeTecnicaLabel,
  filtrarOsCalendario,
  obterDashboardCalendarioOS
} from '../../services/manutencaoService.js';
import { prioridadeLabel, statusLabel } from '../../services/osService.js';

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function monthLabel(date) {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function eventTone(os) {
  const today = new Date().toISOString().slice(0, 10);
  const day = String(os.data_programada || '').slice(0, 10);
  if (day && day < today && !['concluida_tecnicos'].includes(os.status)) return 'border-red-300/40 bg-red-500/15 text-red-100';
  if (['em_execucao', 'pausada', 'concluida_tecnicos'].includes(os.status)) return 'border-yellow-300/35 bg-yellow-400/15 text-yellow-100';
  return 'border-blue-300/35 bg-blue-500/15 text-blue-100';
}

function defaultFilters(user) {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { ebapId: '', area: user?.perfil === 'supervisor' ? user.area_supervisao || user.area_operacional || '' : '', equipe: '', status: '', inicio: start, fim: end };
}

export default function ManutencaoCalendario({ osItems = [], ebaps = [], user }) {
  const [cursor, setCursor] = useState(() => new Date());
  const [filters, setFilters] = useState(() => defaultFilters(user));
  const allowedTeams = useMemo(() => equipesPorArea(filters.area || (user?.perfil === 'supervisor' ? user.area_supervisao || user.area_operacional : '')), [filters.area, user]);
  const visibleOs = useMemo(() => filtrarOsCalendario(osItems, filters), [osItems, filters]);
  const dashboard = useMemo(() => obterDashboardCalendarioOS(osItems), [osItems]);

  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  const days = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
  const itemsByDay = visibleOs.reduce((acc, os) => {
    const key = String(os.data_programada || '').slice(0, 10);
    acc[key] = [...(acc[key] || []), os];
    return acc;
  }, {});

  function setField(field, value) {
    setFilters((current) => ({ ...current, [field]: value, ...(field === 'area' ? { equipe: '' } : {}) }));
  }

  function moveMonth(delta) {
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={CalendarCheck2} label="OS Programadas" value={dashboard.programadas} helper="Programadas ou encaminhadas" tone="blue" />
        <KpiCard icon={PlayCircle} label="OS Em Andamento" value={dashboard.emAndamento} helper="Execução em campo" tone="orange" />
        <KpiCard icon={AlertTriangle} label="OS Atrasadas" value={dashboard.atrasadas} helper="Programação vencida" tone="red" />
        <KpiCard icon={Clock} label="Concluídas no Mês" value={dashboard.concluidasMes} helper="Não aparecem no calendário" tone="green" />
      </div>

      <section className="glass-card rounded-3xl p-4">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <label className="field-label">EBAP
            <select className="form-control" value={filters.ebapId} onChange={(event) => setField('ebapId', event.target.value)}>
              <option value="">Todas</option>
              {ebaps.map((ebap) => <option key={ebap.id} value={ebap.id}>{ebap.nome}</option>)}
            </select>
          </label>
          <label className="field-label">Área
            <select className="form-control" value={filters.area} onChange={(event) => setField('area', event.target.value)} disabled={user?.perfil === 'supervisor'}>
              <option value="">Todas</option>
              {MANUTENCAO_AREAS.filter((area) => area.value !== 'operacional').map((area) => <option key={area.value} value={area.value}>{area.label}</option>)}
            </select>
          </label>
          <label className="field-label">Equipe
            <select className="form-control" value={filters.equipe} onChange={(event) => setField('equipe', event.target.value)}>
              <option value="">Todas</option>
              {allowedTeams.map((equipe) => <option key={equipe.value} value={equipe.value}>{equipe.label}</option>)}
            </select>
          </label>
          <label className="field-label">Status
            <select className="form-control" value={filters.status} onChange={(event) => setField('status', event.target.value)}>
              <option value="">Todos</option>
              {MANUTENCAO_CALENDARIO_STATUS.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
            </select>
          </label>
          <label className="field-label">Início<input className="form-control" type="date" value={filters.inicio} onChange={(event) => setField('inicio', event.target.value)} /></label>
          <label className="field-label">Fim<input className="form-control" type="date" value={filters.fim} onChange={(event) => setField('fim', event.target.value)} /></label>
        </div>
      </section>

      <section className="glass-card rounded-3xl p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-black text-white">Calendário de OS</h3>
            <p className="text-sm text-slate-300">Visão consolidada das ordens programadas e em execução.</p>
          </div>
          <div className="flex gap-2">
            <button className="secondary-button" type="button" onClick={() => moveMonth(-1)}>Anterior</button>
            <strong className="grid min-h-10 place-items-center rounded-2xl border border-cyan-300/15 px-4 text-sm text-white capitalize">{monthLabel(cursor)}</strong>
            <button className="secondary-button" type="button" onClick={() => moveMonth(1)}>Próximo</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-black uppercase text-slate-400">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((label) => <div key={label}>{label}</div>)}
        </div>
        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-7">
          {days.map((day) => {
            const key = dateKey(day);
            const inMonth = day.getMonth() === cursor.getMonth();
            const items = itemsByDay[key] || [];
            return (
              <div key={key} className={
                'min-h-36 rounded-2xl border p-2 text-left ' +
                (inMonth ? 'border-cyan-300/15 bg-navy-950/35' : 'border-white/5 bg-navy-950/15 opacity-55')
              }>
                <span className="text-xs font-black text-slate-300">{day.getDate()}</span>
                <div className="mt-2 grid gap-1.5">
                  {items.map((os) => (
                    <Link key={os.id} to={'/os/' + os.id} className={'rounded-xl border px-2 py-2 text-left text-[11px] font-bold transition hover:border-white/50 ' + eventTone(os)} title={os.titulo}>
                      <strong className="block truncate">{os.numero}</strong>
                      <span className="block truncate">{os.titulo}</span>
                      <span className="block truncate opacity-90">{os.ebap?.nome || '-'} • {equipeTecnicaLabel(os.equipe_responsavel || os.equipe)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="glass-card rounded-3xl p-4">
        <h3 className="mb-3 text-lg font-black text-white">Itens do período</h3>
        <div className="grid gap-3">
          {visibleOs.length ? visibleOs.map((os) => (
            <Link key={os.id} to={'/os/' + os.id} className="grid gap-2 rounded-2xl border border-cyan-300/15 bg-navy-950/45 p-4 transition hover:border-cyan-300/40 md:grid-cols-[1fr_auto]">
              <div>
                <strong className="text-white">{os.numero} - {os.titulo}</strong>
                <p className="mt-1 text-sm text-slate-300">{os.ebap?.nome || '-'} • {equipeTecnicaLabel(os.equipe_responsavel || os.equipe)} • {MANUTENCAO_AREAS.find((area) => area.value === os.area)?.label || os.area || '-'}</p>
                <p className="mt-1 text-xs font-bold text-slate-400">Prioridade: {prioridadeLabel(os.prioridade)} • Data: {String(os.data_programada || '').slice(0, 10)} • Status: {statusLabel(os.status)}</p>
              </div>
              <span className={'self-start rounded-full border px-3 py-1 text-xs font-black ' + eventTone(os)}>{statusLabel(os.status)}</span>
            </Link>
          )) : <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/45 p-6 text-center font-bold text-slate-300">Nenhuma OS programada ou em andamento para os filtros selecionados.</div>}
        </div>
      </section>
    </div>
  );
}
