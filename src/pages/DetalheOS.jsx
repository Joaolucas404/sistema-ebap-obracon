import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarClock, CheckCircle2, Paperclip, Pencil, Play, Upload, UserPlus, XCircle } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Modal from '../components/ui/Modal.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import Toast from '../components/ui/Toast.jsx';
import OSComments from '../components/os/OSComments.jsx';
import OSEquipmentSelector from '../components/os/OSEquipmentSelector.jsx';
import OSTimeline from '../components/os/OSTimeline.jsx';
import { useAuthStore } from '../store/authStore.js';
import {
  atualizarOS,
  atribuirProgramarOS,
  buscarOS,
  criarComentarioOS,
  encerrarOS,
  listarAnexosOS,
  listarComentariosOS,
  listarHistoricoOS,
  listarResponsaveis,
  obterUrlAssinadaAnexo,
  OS_PRIORIDADES,
  OS_STATUS,
  podeAtribuirOS,
  podeEditarOS,
  podeEncerrarOS,
  podeExecutarOS,
  prioridadeLabel,
  prioridadeTone,
  registrarExecucaoOS,
  statusLabel,
  statusTone,
  uploadAnexoOS
} from '../services/osService.js';

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('pt-BR');
}

function dateInput(value) {
  return value ? String(value).slice(0, 10) : '';
}

function timeInput(value) {
  return value ? String(value).slice(0, 5) : '';
}

export default function DetalheOS() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [os, setOs] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [comentarios, setComentarios] = useState([]);
  const [anexos, setAnexos] = useState([]);
  const [responsaveis, setResponsaveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [execucao, setExecucao] = useState({ relatorio_tecnico: '', materiais_utilizados: '', pendencias: '', concluir: false });
  const [encerramento, setEncerramento] = useState({ status: 'concluida', descricao: '', motivo_cancelamento: '' });
  const [upload, setUpload] = useState({ file: null, legenda: '' });
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', tone: 'cyan' });

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [osData, historicoRows, comentariosRows, anexosRows, responsavelRows] = await Promise.all([
        buscarOS(id),
        listarHistoricoOS(id),
        listarComentariosOS(id),
        listarAnexosOS(id),
        listarResponsaveis()
      ]);
      setOs(osData);
      setHistorico(historicoRows);
      setComentarios(comentariosRows);
      setAnexos(anexosRows);
      setResponsaveis(responsavelRows);
    } catch (err) {
      setError(err.message || 'Falha ao carregar OS.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [id]);

  function openEdit() {
    setForm({
      ebap_id: os.ebap_id || '',
      equipamento_id: os.equipamento_id || '',
      titulo: os.titulo || '',
      descricao: os.descricao || '',
      prioridade: os.prioridade || 'media',
      status: os.status || 'aberta',
      area: os.area || '',
      responsavel_id: os.responsavel_id || '',
      equipe_responsavel: os.equipe_responsavel || '',
      data_programada: dateInput(os.data_programada),
      hora_programada: timeInput(os.hora_programada),
      turno: os.turno || ''
    });
    setModal('edit');
  }

  function openSchedule() {
    setForm({
      responsavel_id: os.responsavel_id || '',
      equipe_responsavel: os.equipe_responsavel || '',
      data_programada: dateInput(os.data_programada),
      hora_programada: timeInput(os.hora_programada),
      turno: os.turno || ''
    });
    setModal('schedule');
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleEdit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await atualizarOS(id, form, user);
      setToast({ message: 'OS atualizada.', tone: 'green' });
      setModal(null);
      await loadAll();
    } catch (err) {
      setError(err.message || 'Falha ao atualizar OS.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSchedule(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await atribuirProgramarOS(id, form, user);
      setToast({ message: 'OS atribuída e programada.', tone: 'green' });
      setModal(null);
      await loadAll();
    } catch (err) {
      setError(err.message || 'Falha ao programar OS.');
    } finally {
      setSaving(false);
    }
  }

  async function handleExecution(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await registrarExecucaoOS(id, execucao, user);
      setToast({ message: execucao.concluir ? 'Execução concluída e enviada para aprovação.' : 'Execução registrada.', tone: 'green' });
      setExecucao({ relatorio_tecnico: '', materiais_utilizados: '', pendencias: '', concluir: false });
      setModal(null);
      await loadAll();
    } catch (err) {
      setError(err.message || 'Falha ao registrar execução.');
    } finally {
      setSaving(false);
    }
  }

  async function handleEncerramento(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await encerrarOS(id, encerramento, user);
      setToast({ message: 'Encerramento registrado.', tone: encerramento.status === 'concluida' ? 'green' : 'orange' });
      setModal(null);
      await loadAll();
    } catch (err) {
      setError(err.message || 'Falha ao encerrar OS.');
    } finally {
      setSaving(false);
    }
  }

  async function handleComment(comentario) {
    await criarComentarioOS(id, comentario, user);
    setComentarios(await listarComentariosOS(id));
    setHistorico(await listarHistoricoOS(id));
  }

  async function handleUpload(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await uploadAnexoOS(id, upload.file, user, upload.legenda);
      setToast({ message: 'Anexo enviado.', tone: 'green' });
      setUpload({ file: null, legenda: '' });
      setModal(null);
      setAnexos(await listarAnexosOS(id));
      setHistorico(await listarHistoricoOS(id));
    } catch (err) {
      setError(err.message || 'Falha ao enviar anexo.');
    } finally {
      setSaving(false);
    }
  }

  async function openAnexo(anexo) {
    try {
      const url = await obterUrlAssinadaAnexo(anexo);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setToast({ message: err.message || 'Falha ao abrir anexo.', tone: 'red' });
    }
  }

  if (loading) {
    return <div className="glass-card rounded-3xl p-8 text-center text-slate-300">Carregando detalhes da OS...</div>;
  }

  if (!os) {
    return (
      <div className="grid gap-4">
        <PageHeader title="OS não encontrada" description={error || 'Não foi possível localizar esta ordem de serviço.'} />
        <button className="secondary-button justify-self-start" type="button" onClick={() => navigate('/os')}>
          <ArrowLeft size={17} />
          Voltar
        </button>
      </div>
    );
  }

  const canEdit = podeEditarOS(user?.perfil, os);
  const canSchedule = podeAtribuirOS(user?.perfil);
  const canExecute = podeExecutarOS(user?.perfil, os, user?.id);
  const canClose = podeEncerrarOS(user?.perfil);

  return (
    <div className="grid gap-4">
      <PageHeader
        title={`${os.numero} - ${os.titulo}`}
        description={os.descricao}
        actions={
          <>
            <Link className="secondary-button" to="/os">
              <ArrowLeft size={17} />
              Voltar
            </Link>
            {canEdit && (
              <button className="secondary-button" type="button" onClick={openEdit}>
                <Pencil size={17} />
                Editar
              </button>
            )}
            {canSchedule && (
              <button className="secondary-button" type="button" onClick={openSchedule}>
                <UserPlus size={17} />
                Atribuir
              </button>
            )}
            {canExecute && (
              <button className="primary-button" type="button" onClick={() => setModal('execute')}>
                <Play size={17} />
                Execução
              </button>
            )}
            {canClose && (
              <button className="primary-button" type="button" onClick={() => setModal('close')}>
                <CheckCircle2 size={17} />
                Encerrar
              </button>
            )}
          </>
        }
      />

      {error && <div className="rounded-2xl border border-red-300/30 bg-red-500/15 p-4 text-sm font-bold text-red-100">{error}</div>}

      <section className="glass-card rounded-3xl p-5">
        <div className="grid gap-4 md:grid-cols-4">
          <Info label="Status" value={<StatusBadge tone={statusTone(os.status)}>{statusLabel(os.status)}</StatusBadge>} />
          <Info label="Prioridade" value={<StatusBadge tone={prioridadeTone(os.prioridade)}>{prioridadeLabel(os.prioridade)}</StatusBadge>} />
          <Info label="EBAP" value={os.ebap?.nome || '-'} />
          <Info label="Equipamento" value={os.equipamento?.nome || '-'} />
          <Info label="Solicitante" value={os.solicitante?.nome || '-'} />
          <Info label="Responsável" value={os.responsavel?.nome || '-'} />
          <Info label="Programação" value={os.data_programada ? `${formatDate(os.data_programada)} ${os.hora_programada || ''}` : '-'} />
          <Info label="Criada em" value={formatDate(os.created_at)} />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <section className="glass-card rounded-3xl p-5">
          <h3 className="mb-4 text-xl font-black text-white">Comentários</h3>
          <OSComments comentarios={comentarios} onSubmit={handleComment} />
        </section>

        <section className="glass-card rounded-3xl p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-xl font-black text-white">Anexos e fotos</h3>
            {(canExecute || canEdit || canClose) && (
              <button className="secondary-button" type="button" onClick={() => setModal('upload')}>
                <Upload size={17} />
                Anexar
              </button>
            )}
          </div>
          <div className="grid gap-3">
            {anexos.length ? (
              anexos.map((anexo) => (
                <button
                  key={anexo.id}
                  type="button"
                  className="grid grid-cols-[32px_minmax(0,1fr)] gap-3 rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4 text-left hover:border-cyan-300/40"
                  onClick={() => openAnexo(anexo)}
                >
                  <Paperclip className="text-cyan-200" size={20} />
                  <span className="min-w-0">
                    <strong className="block truncate text-white">{anexo.nome_original}</strong>
                    <small className="block truncate text-slate-400">{anexo.legenda || anexo.mime_type || 'Arquivo da OS'}</small>
                  </span>
                </button>
              ))
            ) : (
              <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4 text-sm text-slate-300">Nenhum anexo enviado.</div>
            )}
          </div>
        </section>
      </div>

      <section className="glass-card rounded-3xl p-5">
        <h3 className="mb-4 text-xl font-black text-white">Timeline e histórico</h3>
        <OSTimeline historico={historico} />
      </section>

      <Modal open={modal === 'edit'} title="Editar OS" onClose={() => setModal(null)}>
        <form className="grid gap-4" onSubmit={handleEdit}>
          <div className="grid gap-4 md:grid-cols-2">
            <OSEquipmentSelector ebapId={form.ebap_id} equipamentoId={form.equipamento_id} onChange={(patch) => setForm((current) => ({ ...current, ...patch }))} />
            <label className="field-label">
              Status
              <select className="form-control" value={form.status} onChange={(event) => updateForm('status', event.target.value)}>
                {OS_STATUS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Prioridade
              <select className="form-control" value={form.prioridade} onChange={(event) => updateForm('prioridade', event.target.value)}>
                {OS_PRIORIDADES.map((prioridade) => (
                  <option key={prioridade.value} value={prioridade.value}>
                    {prioridade.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label md:col-span-2">
              Título
              <input className="form-control" value={form.titulo || ''} onChange={(event) => updateForm('titulo', event.target.value)} required />
            </label>
            <label className="field-label md:col-span-2">
              Descrição
              <textarea className="form-control min-h-28 py-3" value={form.descricao || ''} onChange={(event) => updateForm('descricao', event.target.value)} required />
            </label>
          </div>
          <Actions saving={saving} onCancel={() => setModal(null)} label="Salvar alterações" />
        </form>
      </Modal>

      <Modal open={modal === 'schedule'} title="Atribuir e programar OS" onClose={() => setModal(null)}>
        <form className="grid gap-4" onSubmit={handleSchedule}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="field-label">
              Responsável técnico
              <select className="form-control" value={form.responsavel_id || ''} onChange={(event) => updateForm('responsavel_id', event.target.value)} required>
                <option value="">Selecione...</option>
                {responsaveis.map((responsavel) => (
                  <option key={responsavel.id} value={responsavel.id}>
                    {responsavel.nome} - {responsavel.perfil}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Equipe
              <input className="form-control" value={form.equipe_responsavel || ''} onChange={(event) => updateForm('equipe_responsavel', event.target.value)} placeholder="Equipe A" />
            </label>
            <label className="field-label">
              Data programada
              <input className="form-control" type="date" value={form.data_programada || ''} onChange={(event) => updateForm('data_programada', event.target.value)} required />
            </label>
            <label className="field-label">
              Horário
              <input className="form-control" type="time" value={form.hora_programada || ''} onChange={(event) => updateForm('hora_programada', event.target.value)} />
            </label>
            <label className="field-label md:col-span-2">
              Turno
              <input className="form-control" value={form.turno || ''} onChange={(event) => updateForm('turno', event.target.value)} placeholder="Diurno, noturno, 06:00 às 18:00..." />
            </label>
          </div>
          <Actions saving={saving} onCancel={() => setModal(null)} label="Programar OS" />
        </form>
      </Modal>

      <Modal open={modal === 'execute'} title="Registrar execução técnica" onClose={() => setModal(null)}>
        <form className="grid gap-4" onSubmit={handleExecution}>
          <label className="field-label">
            Relatório de execução
            <textarea className="form-control min-h-28 py-3" value={execucao.relatorio_tecnico} onChange={(event) => setExecucao((current) => ({ ...current, relatorio_tecnico: event.target.value }))} required />
          </label>
          <label className="field-label">
            Materiais utilizados
            <textarea className="form-control min-h-24 py-3" value={execucao.materiais_utilizados} onChange={(event) => setExecucao((current) => ({ ...current, materiais_utilizados: event.target.value }))} />
          </label>
          <label className="field-label">
            Pendências
            <textarea className="form-control min-h-24 py-3" value={execucao.pendencias} onChange={(event) => setExecucao((current) => ({ ...current, pendencias: event.target.value }))} />
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4 text-sm font-bold text-slate-200">
            <input type="checkbox" checked={execucao.concluir} onChange={(event) => setExecucao((current) => ({ ...current, concluir: event.target.checked }))} />
            Concluir atividade e enviar para aprovação do Supervisor
          </label>
          <Actions saving={saving} onCancel={() => setModal(null)} label="Salvar execução" />
        </form>
      </Modal>

      <Modal open={modal === 'close'} title="Encerrar OS" onClose={() => setModal(null)}>
        <form className="grid gap-4" onSubmit={handleEncerramento}>
          <label className="field-label">
            Status final
            <select className="form-control" value={encerramento.status} onChange={(event) => setEncerramento((current) => ({ ...current, status: event.target.value }))}>
              <option value="concluida">Concluída</option>
              <option value="rejeitada">Rejeitada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </label>
          <label className="field-label">
            Parecer do encerramento
            <textarea className="form-control min-h-28 py-3" value={encerramento.descricao} onChange={(event) => setEncerramento((current) => ({ ...current, descricao: event.target.value }))} required />
          </label>
          {encerramento.status !== 'concluida' && (
            <label className="field-label">
              Motivo
              <textarea className="form-control min-h-24 py-3" value={encerramento.motivo_cancelamento} onChange={(event) => setEncerramento((current) => ({ ...current, motivo_cancelamento: event.target.value }))} required />
            </label>
          )}
          <Actions saving={saving} onCancel={() => setModal(null)} label="Confirmar encerramento" />
        </form>
      </Modal>

      <Modal open={modal === 'upload'} title="Anexar foto ou arquivo" onClose={() => setModal(null)}>
        <form className="grid gap-4" onSubmit={handleUpload}>
          <label className="field-label">
            Arquivo
            <input className="form-control py-3" type="file" accept="image/*,application/pdf" onChange={(event) => setUpload((current) => ({ ...current, file: event.target.files?.[0] || null }))} required />
          </label>
          <label className="field-label">
            Legenda
            <input className="form-control" value={upload.legenda} onChange={(event) => setUpload((current) => ({ ...current, legenda: event.target.value }))} />
          </label>
          <Actions saving={saving} onCancel={() => setModal(null)} label="Enviar anexo" />
        </form>
      </Modal>

      <Toast message={toast.message} tone={toast.tone} onClose={() => setToast({ message: '', tone: 'cyan' })} />
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4">
      <small className="block text-xs font-black uppercase tracking-wide text-slate-400">{label}</small>
      <div className="mt-2 font-bold text-white">{value}</div>
    </div>
  );
}

function Actions({ saving, onCancel, label }) {
  return (
    <div className="flex justify-end gap-2">
      <button className="secondary-button" type="button" onClick={onCancel}>
        <XCircle size={17} />
        Cancelar
      </button>
      <button className="primary-button" type="submit" disabled={saving}>
        <CalendarClock size={17} />
        {label}
      </button>
    </div>
  );
}
