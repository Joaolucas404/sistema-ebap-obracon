import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  ListTodo,
  PlayCircle,
  RefreshCcw,
  Trash2,
  Wrench,
  XCircle
} from 'lucide-react';
import KpiCard from '../components/ui/KpiCard.jsx';
import Modal from '../components/ui/Modal.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import Toast from '../components/ui/Toast.jsx';
import {
  atualizarStatusAtividadeAgenda,
  carregarAgendaOperacional,
  filtrarAgendaPorAba,
  gerarOsAtividadeAgenda,
  podeGerarOsAgenda,
  statusAgendaTone
} from '../services/agendaOperacionalService.js';
import {
  cancelarEventoCronograma,
  duplicarEventoCronograma,
  excluirEventoCronograma,
  salvarEventoCronograma
} from '../services/manutencaoService.js';
import { useAuthStore } from '../store/authStore.js';

const TABS = [
  { key: 'hoje', label: 'Hoje' },
  { key: 'amanha', label: 'Amanhã' },
  { key: '7dias', label: 'Próximos 7 dias' },
  { key: '30dias', label: 'Próximos 30 dias' },
  { key: 'atrasadas', label: 'Atrasadas' },
  { key: 'concluidas', label: 'Concluídas' },
  { key: 'todas', label: 'Todas' },
  { key: 'calendario', label: 'Calendário' }
];

export default function AgendaOperacional() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('hoje');
  const [agenda, setAgenda] = useState({ atividades: [], eventos: [], osRows: [], kpis: {} });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState({ message: '', tone: 'cyan' });
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, [user]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await carregarAgendaOperacional(user);
      setAgenda(data);
    } catch (err) {
      setError(err.message || 'Não foi possível carregar a agenda operacional.');
    } finally {
      setLoading(false);
    }
  }

  const visible = useMemo(() => {
    if (activeTab === 'calendario') return agenda.atividades;
    return filtrarAgendaPorAba(agenda.atividades, activeTab);
  }, [agenda.atividades, activeTab]);

  const calendarGroups = useMemo(() => {
    return agenda.atividades.reduce((acc, item) => {
      const key = item.data || item.data_programada || 'sem-data';
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [agenda.atividades]);

  async function runAction(label, action) {
    setSaving(true);
    setError('');
    try {
      await action();
      await load();
      setSelected(null);
      setToast({ message: label, tone: 'green' });
    } catch (err) {
      setError(err.message || 'Não foi possível executar a ação.');
      setToast({ message: err.message || 'Falha ao executar a ação.', tone: 'red' });
    } finally {
      setSaving(false);
    }
  }

  function openOs(item) {
    const osId = item.os_id || item.id;
    if (osId) navigate(`/os/${osId}`);
  }

  const kpis = [
    { icon: CalendarDays, label: 'Atividades Hoje', value: agenda.kpis.hoje || 0, helper: 'Trabalho programado', tone: 'blue' },
    { icon: AlertTriangle, label: 'Atividades Atrasadas', value: agenda.kpis.atrasadas || 0, helper: 'Exigem reprogramação', tone: 'red' },
    { icon: PlayCircle, label: 'OS em andamento', value: agenda.kpis.osEmAndamento || 0, helper: 'Execução ativa', tone: 'orange' },
    { icon: Clock3, label: 'OS aguardando supervisor', value: agenda.kpis.aguardandoSupervisor || 0, helper: 'Fila de análise', tone: 'indigo' },
    { icon: CheckCircle2, label: 'OS concluídas hoje', value: agenda.kpis.concluidasHoje || 0, helper: 'Finalizadas no dia', tone: 'green' },
    { icon: ListTodo, label: 'Total da semana', value: agenda.kpis.semana || 0, helper: 'Próximos 7 dias', tone: 'cyan' }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda Operacional"
        description="Centro diário de atividades, OS, lembretes e programação das equipes."
        actions={(
          <div className="flex flex-wrap gap-2">
            <button className="secondary-button" type="button" onClick={() => navigate('/manutencao')}>
              <CalendarDays size={18} /> Planejamento
            </button>
            <button className="primary-button" type="button" onClick={load} disabled={loading}>
              <RefreshCcw size={18} /> Atualizar
            </button>
          </div>
        )}
      />

      {error && <div className="glass-card rounded-2xl border-red-300/30 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
      </section>

      <section className="glass-card rounded-3xl p-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={activeTab === tab.key ? 'primary-button min-h-10 whitespace-nowrap' : 'secondary-button min-h-10 whitespace-nowrap'}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === 'calendario' ? (
        <AgendaCalendar groups={calendarGroups} onSelect={setSelected} />
      ) : (
        <section className="space-y-3">
          {loading && <div className="glass-card rounded-3xl p-8 text-center text-slate-300">Carregando agenda operacional...</div>}
          {!loading && visible.length === 0 && (
            <div className="glass-card rounded-3xl p-8 text-center text-slate-300">Nenhuma atividade encontrada para este filtro.</div>
          )}
          {!loading && visible.map((item) => (
            <AgendaItem
              key={item.agendaId}
              item={item}
              saving={saving}
              onOpen={() => setSelected(item)}
              onOpenOs={() => openOs(item)}
              onStart={() => runAction('Atividade iniciada.', () => atualizarStatusAtividadeAgenda(item, 'em_execucao', user))}
              onFinish={() => runAction('Atividade concluída.', () => atualizarStatusAtividadeAgenda(item, 'concluida', user))}
              onCancel={() => runAction('Atividade cancelada.', () => cancelarEventoCronograma(item, user))}
              onDuplicate={() => runAction('Atividade duplicada.', () => duplicarEventoCronograma(item, user))}
              onGenerateOs={() => runAction('OS gerada a partir da atividade.', () => gerarOsAtividadeAgenda(item, user))}
            />
          ))}
        </section>
      )}

      <Modal open={!!selected} title="Detalhes da atividade" onClose={() => setSelected(null)} fullMobile>
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-400">{selected.data} {selected.horario || ''}</p>
                <h3 className="text-2xl font-semibold text-white">{selected.titulo}</h3>
                <p className="mt-1 text-sm text-slate-300">{selected.descricao}</p>
              </div>
              <StatusBadge tone={statusAgendaTone(selected.status, selected.source)} size="md">{selected.statusLabel}</StatusBadge>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Info label="EBAP" value={selected.ebap || '-'} />
              <Info label="Equipamento" value={selected.equipamento || '-'} />
              <Info label="Área" value={selected.areaLabel || '-'} />
              <Info label="Equipe" value={selected.equipe || '-'} />
              <Info label="Origem" value={selected.origemLabel || '-'} />
              <Info label="Responsável" value={selected.responsavel || '-'} />
              <Info label="Observações" value={selected.observacoes || selected.descricao || '-'} wide />
            </div>
            <div className="flex flex-wrap gap-2">
              {selected.os_id && <button className="primary-button" type="button" onClick={() => openOs(selected)}><ExternalLink size={18} />Abrir OS</button>}
              {podeGerarOsAgenda(selected) && <button className="secondary-button" type="button" disabled={saving} onClick={() => runAction('OS gerada a partir da atividade.', () => gerarOsAtividadeAgenda(selected, user))}><Wrench size={18} />Gerar OS</button>}
              {selected.source === 'cronograma' && <button className="secondary-button" type="button" disabled={saving} onClick={() => runAction('Atividade iniciada.', () => atualizarStatusAtividadeAgenda(selected, 'em_execucao', user))}><PlayCircle size={18} />Iniciar</button>}
              {selected.source === 'cronograma' && <button className="secondary-button" type="button" disabled={saving} onClick={() => runAction('Atividade concluída.', () => atualizarStatusAtividadeAgenda(selected, 'concluida', user))}><CheckCircle2 size={18} />Concluir</button>}
              {selected.source === 'cronograma' && <button className="secondary-button" type="button" disabled={saving} onClick={() => runAction('Atividade duplicada.', () => duplicarEventoCronograma(selected, user))}><Copy size={18} />Duplicar</button>}
              {selected.source === 'cronograma' && <button className="secondary-button" type="button" disabled={saving} onClick={() => runAction('Atividade movida para amanhã.', () => salvarEventoCronograma({ ...selected, data_programada: tomorrow() }, user))}><CalendarDays size={18} />Mover Data</button>}
              {selected.source === 'cronograma' && <button className="secondary-button border-red-300/35 bg-red-500/15 text-red-100" type="button" disabled={saving} onClick={() => runAction('Atividade cancelada.', () => cancelarEventoCronograma(selected, user))}><XCircle size={18} />Cancelar</button>}
              {selected.source === 'cronograma' && <button className="secondary-button border-red-300/35 bg-red-500/15 text-red-100" type="button" disabled={saving} onClick={() => runAction('Atividade excluída.', () => excluirEventoCronograma(selected, user))}><Trash2 size={18} />Excluir</button>}
            </div>
          </div>
        )}
      </Modal>

      <Toast message={toast.message} tone={toast.tone} onClose={() => setToast({ message: '', tone: 'cyan' })} />
    </div>
  );
}

function AgendaItem({ item, saving, onOpen, onOpenOs, onStart, onFinish, onCancel, onDuplicate, onGenerateOs }) {
  return (
    <article className="glass-card rounded-3xl p-5 transition hover:border-cyan-300/35">
      <div className="grid gap-4 xl:grid-cols-[130px_minmax(0,1fr)_auto] xl:items-center">
        <div>
          <p className="text-sm font-semibold text-slate-400">{item.data || '-'}</p>
          <strong className="mt-1 block text-2xl font-semibold text-white">{item.horario || '--:--'}</strong>
        </div>
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={statusAgendaTone(item.status, item.source)}>{item.statusLabel}</StatusBadge>
            <StatusBadge tone="blue">{item.origemLabel}</StatusBadge>
            <StatusBadge tone="slate">{item.areaLabel}</StatusBadge>
          </div>
          <h3 className="text-xl font-semibold text-white">{item.titulo}</h3>
          <p className="text-sm text-slate-300">
            EBAP: {item.ebap || '-'} • Equipamento: {item.equipamento || '-'} • Equipe: {item.equipe || '-'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 xl:justify-end">
          <button className="secondary-button min-h-10" type="button" onClick={onOpen}>Abrir</button>
          {item.os_id && <button className="primary-button min-h-10" type="button" onClick={onOpenOs}><ExternalLink size={16} />Abrir OS</button>}
          {podeGerarOsAgenda(item) && <button className="secondary-button min-h-10" type="button" disabled={saving} onClick={onGenerateOs}><Wrench size={16} />Gerar OS</button>}
          {item.source === 'cronograma' && !['em_execucao', 'concluida', 'cancelada'].includes(item.status) && <button className="secondary-button min-h-10" type="button" disabled={saving} onClick={onStart}>Iniciar</button>}
          {item.source === 'cronograma' && !['concluida', 'cancelada'].includes(item.status) && <button className="secondary-button min-h-10" type="button" disabled={saving} onClick={onFinish}>Concluir</button>}
          {item.source === 'cronograma' && <button className="secondary-button min-h-10" type="button" disabled={saving} onClick={onDuplicate}>Duplicar</button>}
          {item.source === 'cronograma' && <button className="secondary-button min-h-10 border-red-300/35 bg-red-500/15 text-red-100" type="button" disabled={saving} onClick={onCancel}>Cancelar</button>}
        </div>
      </div>
    </article>
  );
}

function AgendaCalendar({ groups, onSelect }) {
  const days = Object.keys(groups).sort();
  return (
    <section className="glass-card rounded-3xl p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-white">Calendário operacional</h2>
          <p className="text-sm text-slate-300">Visualização mensal simplificada das atividades programadas.</p>
        </div>
        <StatusBadge tone="blue" size="md">{days.length} dia(s)</StatusBadge>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {days.map((day) => (
          <div key={day} className="rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-4">
            <strong className="block text-lg font-semibold text-white">{day}</strong>
            <div className="mt-3 space-y-2">
              {groups[day].slice(0, 5).map((item) => (
                <button key={item.agendaId} className="w-full rounded-xl border border-cyan-300/15 bg-white/5 p-3 text-left text-sm text-slate-200 hover:border-cyan-300/40" type="button" onClick={() => onSelect(item)}>
                  <span className="block font-semibold text-white">{item.horario || '--:--'} • {item.titulo}</span>
                  <span className="text-slate-400">{item.ebap || '-'} • {item.statusLabel}</span>
                </button>
              ))}
              {groups[day].length > 5 && <p className="text-xs text-slate-400">+ {groups[day].length - 5} atividade(s)</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Info({ label, value, wide = false }) {
  return (
    <div className={wide ? 'rounded-2xl border border-cyan-300/15 bg-navy-950/45 p-4 md:col-span-2' : 'rounded-2xl border border-cyan-300/15 bg-navy-950/45 p-4'}>
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</span>
      <p className="mt-1 text-base text-white">{value}</p>
    </div>
  );
}

function tomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}
