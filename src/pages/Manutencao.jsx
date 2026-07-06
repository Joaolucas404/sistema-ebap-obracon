import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  FileSpreadsheet,
  ListChecks,
  Plus,
  RefreshCcw,
  Trash2,
  Wrench,
  XCircle
} from 'lucide-react';
import KpiCard from '../components/ui/KpiCard.jsx';
import Modal from '../components/ui/Modal.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Toast from '../components/ui/Toast.jsx';
import {
  CRONOGRAMA_ABAS_VALIDAS,
  CRONOGRAMA_AREAS,
  CRONOGRAMA_STATUS,
  CRONOGRAMA_TIPOS_EVENTO,
  abasPermitidasManutencao,
  areaDoUsuarioManutencao,
  areaLabel,
  classificarAtividadeManutencao,
  normalizarTexto,
  podeEditarCronograma,
  podeVerTodasAreasManutencao,
  statusCronogramaLabel
} from '../services/manutencaoService.js';
import { useAuthStore } from '../store/authStore.js';
import { useManutencaoStore } from '../store/manutencaoStore.js';

const tabs = [
  { key: 'calendario', label: 'Calendário' },
  { key: 'agenda', label: 'Agenda' },
  { key: 'importacoes', label: 'Importações' },
  { key: 'historico', label: 'Histórico' }
];

const blankEvento = {
  area: 'mecanica',
  equipe: '',
  ebap: '',
  equipamento: '',
  atividade: '',
  descricao: '',
  data_programada: new Date().toISOString().slice(0, 10),
  hora_programada: '',
  status: 'programada',
  tipo_evento: 'Manutenção',
  gerar_os: 'nao'
};

export default function Manutencao() {
  const user = useAuthStore((state) => state.user);
  const {
    dashboard,
    eventos,
    importacoes,
    associacoes,
    ebaps,
    loading,
    saving,
    error,
    carregarTudo,
    salvarEvento,
    importarEventos,
    cancelarEvento,
    excluirEvento,
    duplicarEvento,
    gerarOsEvento
  } = useManutencaoStore();

  const [activeTab, setActiveTab] = useState('calendario');
  const [cursor, setCursor] = useState(() => new Date());
  const [modal, setModal] = useState(null);
  const [eventoForm, setEventoForm] = useState(blankEvento);
  const [selectedEvento, setSelectedEvento] = useState(null);
  const [preview, setPreview] = useState(null);
  const [importMode, setImportMode] = useState('');
  const [localError, setLocalError] = useState('');
  const [toast, setToast] = useState({ message: '', tone: 'cyan' });

  const allowedAreas = useMemo(() => {
    if (podeVerTodasAreasManutencao(user)) return CRONOGRAMA_AREAS;
    const area = areaDoUsuarioManutencao(user);
    return CRONOGRAMA_AREAS.filter((item) => item.value === area);
  }, [user]);
  const canManageAny = allowedAreas.length > 0 && (podeVerTodasAreasManutencao(user) || user?.perfil === 'supervisor');
  const eventosVisiveis = useMemo(() => eventos.filter((evento) => !isWeekdayPlaceholder(evento.atividade)), [eventos]);

  useEffect(() => {
    carregarTudo(user);
  }, [carregarTudo, user]);

  const eventosMes = useMemo(() => {
    const month = cursor.toISOString().slice(0, 7);
    return eventosVisiveis.filter((evento) => String(evento.data_programada || '').startsWith(month));
  }, [eventosVisiveis, cursor]);

  const agenda = useMemo(() => buildAgenda(eventosVisiveis), [eventosVisiveis]);
  const calendarDays = useMemo(() => buildCalendarDays(cursor), [cursor]);
  const byDay = useMemo(() => groupByDate(eventosMes), [eventosMes]);

  function openCreate(date = '') {
    setLocalError('');
    setEventoForm({
      ...blankEvento,
      area: allowedAreas[0]?.value || 'mecanica',
      data_programada: date || new Date().toISOString().slice(0, 10)
    });
    setModal('evento');
  }

  function openEdit(evento) {
    setLocalError('');
    setEventoForm({ ...blankEvento, ...evento, gerar_os: evento.os_id ? 'sim' : 'nao', hora_programada: String(evento.hora_programada || '').slice(0, 5) });
    setModal('evento');
  }

  function openDetails(evento) {
    setSelectedEvento(evento);
    setLocalError('');
    setModal('detalhes');
  }

  function updateEvento(field, value) {
    setEventoForm((current) => ({ ...current, [field]: value }));
  }

  async function submitEvento(event) {
    event.preventDefault();
    try {
      const saved = await salvarEvento({ ...eventoForm, status: eventoForm.id ? eventoForm.status : 'programada', origem: 'manual' }, user);
      if (eventoForm.gerar_os === 'sim' && saved && !saved.os_id) {
        await gerarOsEvento(saved, user);
      }
      setToast({ message: eventoForm.gerar_os === 'sim' ? 'Atividade salva e OS gerada.' : 'Atividade salva no planejamento.', tone: 'green' });
      setModal(null);
    } catch (err) {
      setLocalError(err.message || 'Não foi possível salvar o evento.');
    }
  }

  async function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const parsed = await parseWorkbook(file, user, associacoes);
      setPreview(parsed);
      setImportMode('');
      setModal('preview');
      setLocalError('');
    } catch (err) {
      setLocalError(err.message || 'Não foi possível ler a planilha.');
    }
  }

  async function confirmImport(mode = importMode || 'mesclar') {
    if (!preview?.eventos?.length) {
      setLocalError('Nenhum evento válido foi encontrado para importar. Confira se a planilha possui data e atividade preenchidas.');
      setToast({ message: 'Nenhum evento válido encontrado na planilha.', tone: 'orange' });
      return;
    }
    const pendentes = preview.eventos.filter((evento) => !evento.area);
    if (pendentes.length) {
      setLocalError('Classifique todas as atividades sem área antes de importar.');
      return;
    }
    try {
      await importarEventos({
        arquivo: preview.fileName,
        mesReferencia: preview.mesReferencia,
        modo: mode,
        eventos: preview.eventos,
        resumo: preview.resumo
      }, user);
      setToast({ message: `${preview.eventos.length} evento(s) importado(s).`, tone: 'green' });
      setPreview(null);
      setModal(null);
      setActiveTab('calendario');
    } catch (err) {
      setLocalError(err.message || 'Não foi possível confirmar a importação.');
    }
  }

  function setPreviewArea(index, area) {
    setPreview((current) => ({
      ...current,
      eventos: current.eventos.map((evento, rowIndex) => rowIndex === index ? { ...evento, area } : evento)
    }));
  }

  async function runAction(action, evento, success) {
    try {
      await action(evento, user);
      setToast({ message: success, tone: 'green' });
    } catch (err) {
      setToast({ message: err.message || 'Não foi possível executar a ação.', tone: 'red' });
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Planejamento de Manutenção"
        description="Cronograma operacional, importação mensal, agenda e geração de OS a partir do calendário."
        leading={<span className="grid size-12 place-items-center rounded-2xl bg-blue-500/15 text-blue-100"><CalendarDays size={24} /></span>}
        actions={
          <>
            <button className="secondary-button" type="button" onClick={() => carregarTudo(user)} disabled={loading}>
              <RefreshCcw size={17} />
              Atualizar
            </button>
            {canManageAny && (
              <>
                <label className="secondary-button cursor-pointer">
                  <FileSpreadsheet size={18} />
                  Importar Excel
                  <input className="hidden" type="file" accept=".xls,.xlsx,.xlsm" onChange={handleFile} />
                </label>
                <button className="primary-button" type="button" onClick={() => openCreate()}>
                  <Plus size={18} />
                  Evento manual
                </button>
              </>
            )}
          </>
        }
      />

      {(error || localError) && <div className="rounded-2xl border border-red-300/30 bg-red-500/15 p-4 text-sm font-semibold text-red-100">{localError || error}</div>}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <KpiCard icon={ListChecks} label="Eventos" value={dashboard?.total ?? 0} helper="Cronograma filtrado" tone="blue" />
        <KpiCard icon={CalendarDays} label="Programadas" value={dashboard?.programadas ?? 0} helper="Aguardando execução" tone="blue" />
        <KpiCard icon={Wrench} label="OS geradas" value={dashboard?.osGeradas ?? 0} helper="Já vinculadas" tone="indigo" />
        <KpiCard icon={Clock3} label="Em execução" value={dashboard?.emExecucao ?? 0} helper="Atividade ativa" tone="orange" />
        <KpiCard icon={AlertTriangle} label="Atrasadas" value={dashboard?.atrasadas ?? 0} helper="Exigem atenção" tone="red" />
        <KpiCard icon={CheckCircle2} label="Próx. 7 dias" value={dashboard?.proximos7 ?? 0} helper="Agenda imediata" tone="cyan" />
      </section>

      <section className="page-surface p-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button key={tab.key} className={activeTab === tab.key ? 'primary-button min-h-10' : 'secondary-button min-h-10'} type="button" onClick={() => setActiveTab(tab.key)}>
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="page-surface p-8 text-center text-slate-300">Carregando planejamento...</div>
      ) : (
        <>
          {activeTab === 'calendario' && (
            <CalendarView
              cursor={cursor}
              days={calendarDays}
              byDay={byDay}
              onMove={setCursor}
              onCreate={openCreate}
              onOpen={openDetails}
              canCreate={canManageAny}
              onCancel={(evento) => runAction(cancelarEvento, evento, 'Evento cancelado.')}
              onDelete={(evento) => runAction(excluirEvento, evento, 'Evento excluído.')}
              onDuplicate={(evento) => runAction(duplicarEvento, evento, 'Evento duplicado.')}
              onGenerateOs={(evento) => runAction(gerarOsEvento, evento, 'OS gerada a partir do evento.')}
              canManage={(evento) => podeEditarCronograma(user, evento.area)}
            />
          )}
          {activeTab === 'agenda' && <AgendaView agenda={agenda} onEdit={openDetails} />}
          {activeTab === 'importacoes' && <ImportacoesView importacoes={importacoes} />}
          {activeTab === 'historico' && <HistoricoView eventos={eventos} />}
        </>
      )}

      <Modal open={modal === 'evento'} title={eventoForm.id ? 'Editar atividade' : 'Nova atividade'} onClose={() => setModal(null)} fullMobile>
        {localError && <div className="mb-4 rounded-2xl border border-red-300/30 bg-red-500/15 p-3 text-sm font-semibold text-red-100">{localError}</div>}
        <form className="grid gap-4" onSubmit={submitEvento}>
          <div className="grid gap-4 md:grid-cols-2">
            <Select label="Área" value={eventoForm.area} required onChange={(value) => updateEvento('area', value)}>
              {allowedAreas.map((area) => <option key={area.value} value={area.value}>{area.label}</option>)}
            </Select>
            <Input label="Equipe" value={eventoForm.equipe} onChange={(value) => updateEvento('equipe', value)} />
            <Select label="EBAP" value={eventoForm.ebap} onChange={(value) => updateEvento('ebap', value)}>
              <option value="">Selecione ou digite manualmente</option>
              {ebaps.map((ebap) => <option key={ebap.id} value={ebap.nome}>{ebap.nome}</option>)}
            </Select>
            <Input label="Equipamento" value={eventoForm.equipamento} onChange={(value) => updateEvento('equipamento', value)} />
            <Input label="Data programada" type="date" value={eventoForm.data_programada} required onChange={(value) => updateEvento('data_programada', value)} />
            <Input label="Hora programada" type="time" value={eventoForm.hora_programada || ''} onChange={(value) => updateEvento('hora_programada', value)} />
            <Select label="Status" value={eventoForm.status} onChange={(value) => updateEvento('status', value)}>
              {CRONOGRAMA_STATUS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </Select>
            <Select label="Tipo de evento" value={eventoForm.tipo_evento} onChange={(value) => updateEvento('tipo_evento', value)}>
              {CRONOGRAMA_TIPOS_EVENTO.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
            </Select>
            <Select label="Gerar OS?" value={eventoForm.gerar_os} onChange={(value) => updateEvento('gerar_os', value)}>
              <option value="nao">Não</option>
              <option value="sim">Sim</option>
            </Select>
          </div>
          <Input label="Atividade" value={eventoForm.atividade} required onChange={(value) => updateEvento('atividade', value)} />
          <Textarea label="Descrição" value={eventoForm.descricao || ''} onChange={(value) => updateEvento('descricao', value)} />
          <div className="flex justify-end gap-2">
            <button className="secondary-button" type="button" onClick={() => setModal(null)}>Cancelar</button>
            <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar atividade'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={modal === 'detalhes'} title="Detalhes da atividade" onClose={() => setModal(null)} fullMobile>
        {selectedEvento && (
          <EventoDetails
            evento={selectedEvento}
            canManage={podeEditarCronograma(user, selectedEvento.area)}
            onEdit={() => openEdit(selectedEvento)}
            onCancel={() => runAction(cancelarEvento, selectedEvento, 'Evento cancelado.').then(() => setModal(null))}
            onDelete={() => runAction(excluirEvento, selectedEvento, 'Evento excluído.').then(() => setModal(null))}
            onDuplicate={() => runAction(duplicarEvento, selectedEvento, 'Evento duplicado.').then(() => setModal(null))}
            onGenerateOs={() => runAction(gerarOsEvento, selectedEvento, 'OS gerada a partir do evento.').then(() => setModal(null))}
          />
        )}
      </Modal>

      <Modal open={modal === 'preview'} title="Prévia da importação" onClose={() => setModal(null)}>
        {preview && (
          <ImportPreview
            preview={preview}
            eventosAtuais={eventos}
            importMode={importMode}
            setImportMode={setImportMode}
            onArea={setPreviewArea}
            onConfirm={confirmImport}
            saving={saving}
          />
        )}
      </Modal>

      <Toast message={toast.message} tone={toast.tone} onClose={() => setToast({ message: '', tone: 'cyan' })} />
    </div>
  );
}

function CalendarView({ cursor, days, byDay, onMove, onCreate, onOpen, canCreate, canManage }) {
  return (
    <section className="page-surface p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">Calendário operacional</h3>
          <p className="text-sm text-slate-300">A planilha vira entrada; o calendário vira a fonte oficial da programação.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="secondary-button" type="button" onClick={() => onMove(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>Anterior</button>
          <span className="grid min-h-10 place-items-center rounded-xl border border-blue-300/20 px-4 text-sm font-semibold text-white capitalize">{cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
          <button className="secondary-button" type="button" onClick={() => onMove(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>Próximo</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((label) => <div key={label}>{label}</div>)}
      </div>
      <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-7">
        {days.map((day) => {
          const key = dateKey(day);
          const inMonth = day.getMonth() === cursor.getMonth();
          const items = byDay[key] || [];
          return (
            <div key={key} role={canCreate ? 'button' : undefined} tabIndex={canCreate ? 0 : undefined} className={(inMonth ? 'bg-navy-950/35' : 'bg-navy-950/15 opacity-55') + ' min-h-40 overflow-hidden rounded-2xl border border-blue-300/15 p-2 transition hover:border-blue-300/35 ' + (canCreate ? 'cursor-pointer' : '')} onClick={() => canCreate && onCreate(key)} onKeyDown={(event) => { if (canCreate && (event.key === 'Enter' || event.key === ' ')) onCreate(key); }}>
              <div className="mb-2 text-xs font-semibold text-slate-300">{day.getDate()}</div>
              <div className="grid gap-1.5">
                {items.slice(0, 3).map((evento) => (
                  <EventCard key={evento.id} evento={evento} compact onOpen={(event) => { event.stopPropagation(); onOpen(evento); }} canManage={canManage(evento)} />
                ))}
                {items.length > 3 && <span className="rounded-lg border border-blue-300/15 px-2 py-1 text-xs font-semibold text-slate-300">+ {items.length - 3} evento(s)</span>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function EventCard({ evento, compact = false, onOpen, canManage = false }) {
  const equipeLabel = equipeEventoLabel(evento);
  if (compact) {
    return (
      <button type="button" className={`w-full min-w-0 overflow-hidden rounded-xl border px-2.5 py-2 text-left transition hover:border-white/40 ${areaTone(evento.area)}`} onClick={onOpen}>
        <strong className="block truncate text-sm font-semibold leading-snug text-white" title={evento.atividade}>{evento.atividade}</strong>
        <span className="mt-0.5 block truncate text-xs text-slate-300" title={evento.ebap || 'EBAP não informada'}>{evento.ebap || 'EBAP não informada'}</span>
        <span className="mt-1 flex min-w-0 flex-wrap gap-1">
          {equipeLabel && (
            <span className="inline-flex rounded-full border border-indigo-300/30 bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase leading-none text-indigo-100">
              {equipeBadgeLabel(equipeLabel)}
            </span>
          )}
          <span className="inline-flex max-w-full rounded-full border border-blue-300/25 px-2 py-0.5 text-[10px] font-semibold uppercase leading-none text-blue-100">
            {statusCronogramaLabel(evento.status)}
          </span>
        </span>
        {canManage && <span className="sr-only">Abrir detalhes</span>}
      </button>
    );
  }

  return (
    <button type="button" className={`w-full rounded-xl border p-3 text-left transition hover:border-white/40 ${areaTone(evento.area)}`} onClick={onOpen}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <strong className={(compact ? 'text-xs' : 'text-base') + ' block font-semibold text-white'}>{evento.atividade}</strong>
          <span className="mt-1 block text-xs text-slate-300">{evento.hora_programada ? String(evento.hora_programada).slice(0, 5) + ' - ' : ''}{evento.ebap || 'EBAP não informada'}</span>
          {!compact && <span className="mt-1 block text-xs text-slate-400">{evento.equipamento || '-'} - {equipeLabel || '-'}</span>}
        </div>
        <StatusBadge status={evento.status} />
      </div>
      {!compact && <p className="mt-2 text-sm text-slate-300">{evento.descricao || 'Sem descrição adicional.'}</p>}
      {canManage && compact && <span className="mt-2 block text-[11px] font-semibold text-blue-100">Abrir detalhes</span>}
    </button>
  );
}

function EventoDetails({ evento, canManage, onEdit, onCancel, onDelete, onDuplicate, onGenerateOs }) {
  return (
    <div className="grid gap-4">
      <section className={`rounded-2xl border p-4 ${areaTone(evento.area)}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">{evento.tipo_evento || 'Manutenção'}</span>
            <h3 className="mt-1 text-2xl font-semibold text-white">{evento.atividade}</h3>
            <p className="mt-2 text-sm text-slate-300">{evento.descricao || 'Sem descrição ou observação.'}</p>
          </div>
          <StatusBadge status={evento.status} />
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <InfoLine label="Área" value={areaLabel(evento.area)} />
        <InfoLine label="EBAP" value={evento.ebap || '-'} />
        <InfoLine label="Equipamento" value={evento.equipamento || '-'} />
        <InfoLine label="Equipe" value={equipeEventoLabel(evento) || '-'} />
        <InfoLine label="Data" value={formatDate(evento.data_programada)} />
        <InfoLine label="Hora" value={evento.hora_programada ? String(evento.hora_programada).slice(0, 5) : '-'} />
        <InfoLine label="Origem" value={evento.origem || 'manual'} />
        <InfoLine label="OS vinculada" value={evento.os_id ? 'Sim' : 'Não'} />
      </section>

      {canManage ? (
        <div className="flex flex-wrap justify-end gap-2">
          <button className="secondary-button" type="button" onClick={onEdit}>Editar</button>
          <button className="secondary-button" type="button" onClick={onDuplicate}><Copy size={16} />Duplicar</button>
          <button className="secondary-button" type="button" onClick={onGenerateOs} disabled={!!evento.os_id}>Gerar OS</button>
          <button className="secondary-button" type="button" onClick={onCancel}><XCircle size={16} />Cancelar</button>
          <button className="secondary-button text-red-100" type="button" onClick={onDelete}><Trash2 size={16} />Excluir</button>
        </div>
      ) : (
        <div className="rounded-2xl border border-blue-300/15 bg-navy-950/35 p-4 text-sm text-slate-300">Você possui acesso somente leitura para esta atividade.</div>
      )}
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="rounded-2xl border border-blue-300/15 bg-navy-950/35 p-4">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <strong className="mt-1 block text-white">{value}</strong>
    </div>
  );
}

function AgendaView({ agenda, onEdit }) {
  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {agenda.map((grupo) => (
        <section key={grupo.label} className="page-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">{grupo.label}</h3>
            <span className="rounded-full border border-blue-300/25 px-3 py-1 text-xs font-semibold text-blue-100">{grupo.items.length}</span>
          </div>
          <div className="grid gap-3">
            {grupo.items.length ? grupo.items.map((evento) => (
              <button key={evento.id} className="rounded-2xl border border-blue-300/15 bg-navy-950/35 p-4 text-left transition hover:border-blue-300/40" type="button" onClick={() => onEdit(evento)}>
                <strong className="block text-white">{formatDate(evento.data_programada)} • {evento.atividade}</strong>
                <span className="mt-1 block text-sm text-slate-300">{evento.ebap || '-'} • {areaLabel(evento.area)} • {evento.equipe || '-'}</span>
                <span className="mt-2 inline-block"><StatusBadge status={evento.status} /></span>
              </button>
            )) : <div className="rounded-2xl border border-blue-300/15 p-4 text-sm text-slate-300">Sem itens.</div>}
          </div>
        </section>
      ))}
    </div>
  );
}

function ImportacoesView({ importacoes }) {
  return (
    <section className="page-surface p-5">
      <h3 className="text-xl font-semibold text-white">Histórico de importações</h3>
      <p className="mt-1 text-sm text-slate-300">Arquivos usados como entrada mensal do cronograma.</p>
      <div className="mt-5 grid gap-3">
        {importacoes.length ? importacoes.map((item) => (
          <article key={item.id} className="grid gap-3 rounded-2xl border border-blue-300/15 bg-navy-950/35 p-4 md:grid-cols-[1fr_auto]">
            <div>
              <strong className="text-white">{item.arquivo}</strong>
              <p className="mt-1 text-sm text-slate-300">{(item.abas_importadas || []).join(', ') || '-'} • {item.total_eventos} evento(s)</p>
              <p className="mt-1 text-xs text-slate-400">{formatDateTime(item.criado_em)} • {areaLabel(item.area) || 'Todas as áreas'} • {item.modo}</p>
            </div>
            <span className="self-start rounded-full border border-blue-300/20 px-3 py-1 text-xs font-semibold text-blue-100">{item.mes_referencia || '-'}</span>
          </article>
        )) : <div className="rounded-2xl border border-blue-300/15 p-6 text-center text-slate-300">Nenhuma importação registrada.</div>}
      </div>
    </section>
  );
}

function HistoricoView({ eventos }) {
  return (
    <section className="page-surface p-5">
      <h3 className="text-xl font-semibold text-white">Eventos do planejamento</h3>
      <div className="mt-5 grid gap-3">
        {eventos.map((evento) => (
          <article key={evento.id} className="grid gap-2 rounded-2xl border border-blue-300/15 bg-navy-950/35 p-4 md:grid-cols-[1fr_auto]">
            <div>
              <strong className="text-white">{evento.atividade}</strong>
              <p className="text-sm text-slate-300">{formatDate(evento.data_programada)} {evento.hora_programada ? `às ${String(evento.hora_programada).slice(0, 5)}` : ''} • {evento.ebap || '-'} • {areaLabel(evento.area)}</p>
              <p className="text-xs text-slate-400">{evento.origem} • {evento.arquivo_importado || 'manual'} • linha {evento.linha_origem || '-'}</p>
            </div>
            <StatusBadge status={evento.status} />
          </article>
        ))}
      </div>
    </section>
  );
}

function ImportPreview({ preview, eventosAtuais, importMode, setImportMode, onArea, onConfirm, saving }) {
  const hasExisting = eventosAtuais.some((evento) => preview.mesReferencia && String(evento.data_programada || '').startsWith(preview.mesReferencia));
  const pendentes = preview.eventos.filter((evento) => !evento.area).length;
  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-blue-300/15 bg-navy-950/35 p-4">
        <strong className="text-white">{preview.fileName}</strong>
        <p className="mt-1 text-sm text-slate-300">{preview.eventos.length} evento(s) encontrados • Abas: {preview.abas.join(', ')}</p>
        <p className="mt-1 text-sm text-slate-300">Por área: {Object.entries(preview.resumo.porArea).map(([area, count]) => `${areaLabel(area)} (${count})`).join(' • ') || '-'}</p>
        {preview.erros.length > 0 && <p className="mt-2 text-sm font-semibold text-amber-100">{preview.erros.length} linha(s) ignorada(s) por falta de atividade ou data.</p>}
      </div>
      {!preview.eventos.length && (
        <div className="rounded-2xl border border-amber-300/30 bg-amber-400/10 p-4 text-sm text-amber-50">
          Nenhum evento válido foi encontrado. Confira se as atividades possuem uma data na mesma linha ou em uma coluna de calendário da planilha.
        </div>
      )}
      {hasExisting && (
        <div className="rounded-2xl border border-amber-300/30 bg-amber-400/10 p-4">
          <strong className="text-amber-100">Já existe cronograma para {preview.mesReferencia}.</strong>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className={importMode === 'substituir' ? 'primary-button' : 'secondary-button'} type="button" onClick={() => setImportMode('substituir')}>Substituir cronograma existente</button>
            <button className={importMode === 'mesclar' ? 'primary-button' : 'secondary-button'} type="button" onClick={() => setImportMode('mesclar')}>Mesclar com existente</button>
          </div>
        </div>
      )}
      <div className="max-h-96 overflow-auto rounded-2xl border border-blue-300/15">
        {preview.eventos.slice(0, 80).map((evento, index) => (
          <div key={`${evento.aba_origem}-${evento.linha_origem}`} className="grid gap-3 border-b border-blue-300/10 p-3 md:grid-cols-[1fr_180px]">
            <div>
              <strong className="text-white">{evento.atividade}</strong>
              <p className="text-sm text-slate-300">{formatDate(evento.data_programada)} • {evento.ebap || '-'} • {evento.equipamento || '-'}</p>
              <p className="text-xs text-slate-400">{evento.aba_origem} • linha {evento.linha_origem}</p>
            </div>
            <select className="form-control" value={evento.area} onChange={(event) => onArea(index, event.target.value)}>
              <option value="">Escolher área</option>
              {CRONOGRAMA_AREAS.map((area) => <option key={area.value} value={area.value}>{area.label}</option>)}
            </select>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <button className="primary-button" type="button" onClick={() => onConfirm(hasExisting ? importMode : 'mesclar')} disabled={saving || pendentes > 0 || (hasExisting && !importMode)}>
          {saving ? 'Importando...' : preview.eventos.length ? 'Confirmar importação' : 'Verificar planilha'}
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const tone = {
    programada: 'border-blue-300/35 bg-blue-500/15 text-blue-100',
    os_gerada: 'border-indigo-300/35 bg-indigo-500/15 text-indigo-100',
    em_execucao: 'border-amber-300/35 bg-amber-400/15 text-amber-100',
    concluida: 'border-cyan-300/35 bg-cyan-500/15 text-cyan-100',
    atrasada: 'border-red-300/40 bg-red-500/15 text-red-100',
    reprogramada: 'border-purple-300/35 bg-purple-500/15 text-purple-100',
    cancelada: 'border-slate-300/25 bg-slate-400/15 text-slate-200'
  }[status] || 'border-blue-300/25 bg-blue-500/10 text-blue-100';
  return <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase ${tone}`}>{statusCronogramaLabel(status)}</span>;
}

function Input({ label, value, onChange, type = 'text', required = false }) {
  return <label className="field-label">{label}<input className="form-control" type={type} value={value || ''} required={required} onChange={(event) => onChange(event.target.value)} /></label>;
}

function Select({ label, value, onChange, children, required = false }) {
  return <label className="field-label">{label}<select className="form-control" value={value || ''} required={required} onChange={(event) => onChange(event.target.value)}>{children}</select></label>;
}

function Textarea({ label, value, onChange }) {
  return <label className="field-label">{label}<textarea className="form-control min-h-24 py-3" value={value || ''} onChange={(event) => onChange(event.target.value)} /></label>;
}

async function parseWorkbook(file, user, associacoes) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const allowed = abasPermitidasManutencao(user);
  const allowedMap = new Map(allowed.map((aba) => [normalizarTexto(aba.nome), aba]));
  const abas = workbook.SheetNames.map((name) => ({ original: name, config: allowedMap.get(normalizarTexto(name)) })).filter((item) => item.config);
  if (!abas.length) throw new Error('Nenhuma aba válida para o seu perfil foi encontrada nesta planilha.');

  const eventos = [];
  const erros = [];
  abas.forEach(({ original, config }) => {
    const sheet = workbook.Sheets[original];
    const matrixRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false, blankrows: false });
    const mesPlanilha = inferMesReferencia(file.name, original, matrixRows);
    const seen = new Set();
    const linhasComEvento = new Set();

    const registrarEvento = (evento) => {
      if (!evento?.atividade || !evento?.data_programada) return false;
      const key = [original, evento.linha_origem, evento.data_programada, normalizarTexto(evento.atividade)].join('|');
      if (seen.has(key)) return false;
      seen.add(key);
      eventos.push(evento);
      linhasComEvento.add(evento.linha_origem);
      return true;
    };

    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
    rows.forEach((row, rowIndex) => {
      registrarEvento(buildEventoFromStructuredRow(row, config, associacoes, original, rowIndex + 2, mesPlanilha));
    });

    const result = parseMatrixRows(matrixRows, config, associacoes, original, mesPlanilha, registrarEvento);
    result.ignored.forEach((linha) => {
      if (!linhasComEvento.has(linha)) {
        erros.push({ aba: original, linha, motivo: 'Atividade ou data não encontrada.' });
      }
    });
  });

  const mesReferencia = eventos[0]?.data_programada?.slice(0, 7) || inferMesReferencia(file.name, '', []);
  return {
    fileName: file.name,
    abas: abas.map((aba) => aba.original),
    eventos,
    erros,
    mesReferencia,
    resumo: {
      porArea: countBy(eventos, 'area'),
      porEbap: countBy(eventos, 'ebap'),
      erros
    }
  };
}

function buildEventoFromStructuredRow(row, config, associacoes, aba, linha, mesReferencia = '') {
  const atividade = valueByHeader(row, ['atividades', 'atividade', 'titulo', 'título', 'servico', 'serviço', 'descricao', 'descrição']);
  const data = parseDateValue(valueByHeader(row, ['data', 'dia', 'programada', 'programacao', 'programação', 'dt']), mesReferencia);
  if (!atividade || !data) return null;
  return buildEvento({
    atividade,
    data,
    area: classificarAtividadeManutencao(atividade, associacoes) || config.area,
    ebap: valueByHeader(row, ['ebap', 'estacao', 'estação', 'unidade']),
    equipamento: valueByHeader(row, ['equipamento', 'ativo']),
    equipe: valueByHeader(row, ['equipe']) || inferEquipeFromSheet(aba),
    descricao: valueByHeader(row, ['observacao', 'observação', 'obs']),
    hora: parseTimeValue(valueByHeader(row, ['hora', 'horario', 'horário'])),
    aba,
    linha
  });
}

function parseMatrixRows(rows, config, associacoes, aba, mesReferencia, registrarEvento) {
  const dateByColumn = {};
  const ignored = [];

  rows.forEach((row, rowIndex) => {
    const linha = rowIndex + 1;
    const cells = row.map((cell) => String(cell || '').trim());
    if (!cells.some(Boolean)) return;

    let created = false;
    cells.forEach((cell, columnIndex) => {
      const data = parseDateValue(cell, mesReferencia);
      if (data) dateByColumn[columnIndex] = data;
    });

    cells.forEach((cell, columnIndex) => {
      const data = parseDateValue(cell, mesReferencia);
      if (!data) return;
      const atividade = pickActivityFromRow(cells, columnIndex);
      if (!atividade) return;
      created = registrarEvento(buildEvento({
        atividade,
        data,
        area: classificarAtividadeManutencao(atividade, associacoes) || config.area,
        ebap: extractEbapFromText(cells.join(' ')),
        equipe: inferEquipeFromSheet(aba),
        hora: parseTimeValue(cells.join(' ')),
        aba,
        linha
      })) || created;
    });

    cells.forEach((cell, columnIndex) => {
      if (!dateByColumn[columnIndex] || parseDateValue(cell, mesReferencia) || !isActivityText(cell)) return;
      created = registrarEvento(buildEvento({
        atividade: cell,
        data: dateByColumn[columnIndex],
        area: classificarAtividadeManutencao(cell, associacoes) || config.area,
        ebap: extractEbapFromText(cell),
        equipe: inferEquipeFromSheet(aba),
        hora: parseTimeValue(cell),
        aba,
        linha
      })) || created;
    });

    if (!created && isRelevantRow(cells)) ignored.push(linha);
  });

  return { ignored };
}

function buildEvento({ atividade, data, area, ebap = '', equipamento = '', equipe = '', descricao = '', hora = '', aba, linha }) {
  return {
    atividade: String(atividade || '').trim(),
    ebap,
    equipamento,
    equipe,
    descricao,
    data_programada: data,
    hora_programada: hora,
    area,
    tipo_evento: inferTipoEvento(atividade),
    aba_origem: aba,
    linha_origem: linha
  };
}

function valueByHeader(row, candidates) {
  const entry = Object.entries(row).find(([key]) => candidates.some((candidate) => normalizarTexto(key).includes(normalizarTexto(candidate))));
  return String(entry?.[1] || '').trim();
}

function parseDateValue(value, mesReferencia = '') {
  if (!value) return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === 'number' && value > 25000) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
  }
  const text = String(value).trim();
  if (/^\d{1,2}$/.test(text) && mesReferencia) return `${mesReferencia}-${text.padStart(2, '0')}`;
  if (/^\d{5}(\.\d+)?$/.test(text)) {
    const parsed = XLSX.SSF.parse_date_code(Number(text));
    if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
  }
  const br = text.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
  if (br) {
    const year = br[3].length === 2 ? `20${br[3]}` : br[3];
    const first = Number(br[1]);
    const second = Number(br[2]);
    if (second > 12 && first <= 12) return buildDateString(year, first, second);
    return buildDateString(year, second, first);
  }
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function buildDateString(year, month, day) {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (!y || m < 1 || m > 12 || d < 1 || d > 31) return '';
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return '';
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function parseTimeValue(value) {
  if (!value) return '';
  const text = String(value).trim();
  const match = text.match(/(\d{1,2}):(\d{2})/);
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : '';
}

function inferEquipeFromSheet(aba = '') {
  return normalizarTexto(aba).includes('noite') ? 'Equipe Noite' : '';
}

function equipeEventoLabel(evento) {
  return evento?.equipe || inferEquipeFromSheet(evento?.aba_origem || '');
}

function equipeBadgeLabel(equipe) {
  return normalizarTexto(equipe).includes('noite') ? 'Noite' : equipe;
}

function inferMesReferencia(...sources) {
  const text = normalizarTexto(sources.flat(Infinity).join(' '));
  const months = [
    ['janeiro', '01'], ['jan', '01'],
    ['fevereiro', '02'], ['fev', '02'],
    ['marco', '03'], ['mar', '03'],
    ['abril', '04'], ['abr', '04'],
    ['maio', '05'], ['mai', '05'],
    ['junho', '06'], ['jun', '06'],
    ['julho', '07'], ['jul', '07'],
    ['agosto', '08'], ['ago', '08'],
    ['setembro', '09'], ['set', '09'],
    ['outubro', '10'], ['out', '10'],
    ['novembro', '11'], ['nov', '11'],
    ['dezembro', '12'], ['dez', '12']
  ];
  const year = text.match(/\b(20\d{2})\b/)?.[1] || String(new Date().getFullYear());
  const month = months.find(([name]) => text.includes(name))?.[1];
  return month ? `${year}-${month}` : '';
}

function pickActivityFromRow(cells, dateColumn) {
  return cells
    .filter((cell, index) => index !== dateColumn && isActivityText(cell))
    .sort((a, b) => b.length - a.length)[0] || '';
}

function isRelevantRow(cells) {
  return cells.some((cell) => isActivityText(cell) || parseDateValue(cell));
}

function isActivityText(value) {
  const text = String(value || '').trim();
  if (text.length < 3 || !/[A-Za-zÀ-ÿ]/.test(text)) return false;
  if (parseDateValue(text)) return false;
  const normalized = normalizarTexto(text);
  const ignored = [
    'data', 'dia', 'hora', 'horario', 'atividade', 'atividades', 'programacao',
    'cronograma', 'lista de cronograma', 'manutencao', 'mecanica', 'eletrica',
    'automacao', 'noite', 'ebap', 'equipamento', 'equipe', 'responsavel',
    'observacao', 'domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'
  ];
  return !ignored.some((term) => normalized === term || normalized.startsWith(`${term}:`) || normalized.startsWith(`${term}-`) || normalized.startsWith(`${term} feira`));
}

function isWeekdayPlaceholder(value) {
  return [
    'segunda-feira',
    'segunda feira',
    'terca-feira',
    'terca feira',
    'quarta-feira',
    'quarta feira',
    'quinta-feira',
    'quinta feira',
    'sexta-feira',
    'sexta feira',
    'sabado',
    'domingo'
  ].includes(normalizarTexto(value));
}

function inferTipoEvento(atividade) {
  const text = normalizarTexto(atividade);
  if (text.includes('reuniao')) return 'Reunião';
  if (text.includes('treinamento')) return 'Treinamento';
  if (text.includes('visita')) return 'Visita';
  if (text.includes('inspecao')) return 'Inspeção';
  if (text.includes('auditoria')) return 'Auditoria';
  if (text.includes('parada')) return 'Parada Programada';
  if (text.includes('lembrete') || text.includes('aviso')) return 'Lembrete';
  return 'Manutenção';
}

function extractEbapFromText(value) {
  const text = normalizarTexto(value);
  const ebaps = [
    'Aribiri', 'Bigossi', 'Canal da Costa', 'Cobilândia', 'Comportas',
    'Foz da Costa', 'Guaranhuns', 'Laranja', 'Laranjeiras', 'Marilândia',
    'Marinho', 'Sítio Batalha'
  ];
  return ebaps.find((name) => text.includes(normalizarTexto(name))) || '';
}

function buildCalendarDays(cursor) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function groupByDate(rows) {
  return rows.reduce((acc, row) => {
    const key = String(row.data_programada || '').slice(0, 10);
    acc[key] = [...(acc[key] || []), row];
    return acc;
  }, {});
}

function buildAgenda(eventos) {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().slice(0, 10);
  const in7 = new Date();
  in7.setDate(in7.getDate() + 7);
  const seven = in7.toISOString().slice(0, 10);
  const in30 = new Date();
  in30.setDate(in30.getDate() + 30);
  const thirty = in30.toISOString().slice(0, 10);
  const active = eventos.filter((evento) => !['cancelada', 'concluida'].includes(evento.status));
  return [
    { label: 'Hoje', items: active.filter((evento) => evento.data_programada === today) },
    { label: 'Amanhã', items: active.filter((evento) => evento.data_programada === tomorrow) },
    { label: 'Próximos 7 dias', items: active.filter((evento) => evento.data_programada >= today && evento.data_programada <= seven) },
    { label: 'Próximos 30 dias', items: active.filter((evento) => evento.data_programada >= today && evento.data_programada <= thirty) }
  ];
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

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

function countBy(rows, field) {
  return rows.reduce((acc, row) => {
    const key = row[field] || 'Não informado';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function areaTone(area) {
  return {
    mecanica: 'border-blue-300/25 bg-blue-500/10',
    eletrica: 'border-amber-300/25 bg-amber-400/10',
    automacao: 'border-indigo-300/25 bg-indigo-500/10'
  }[area] || 'border-blue-300/15 bg-navy-950/35';
}
