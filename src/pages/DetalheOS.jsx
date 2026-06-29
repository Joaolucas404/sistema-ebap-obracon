import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CalendarClock, CheckCircle2, Download, Paperclip, Pencil, Play, Trash2, Upload, UserPlus, XCircle } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Modal from '../components/ui/Modal.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import Toast from '../components/ui/Toast.jsx';
import PdfTemplate from '../components/pdf/PdfTemplate.jsx';
import OSComments from '../components/os/OSComments.jsx';
import OSEquipmentSelector from '../components/os/OSEquipmentSelector.jsx';
import OSTimeline from '../components/os/OSTimeline.jsx';
import RelatorioTecnicoDinamico from '../components/os/RelatorioTecnicoDinamico.jsx';
import { useAuthStore } from '../store/authStore.js';
import {
  atualizarOS,
  atribuirProgramarOS,
  buscarOS,
  criarComentarioOS,
  encerrarOS,
  excluirOS,
  getWorkflowActions,
  listarAnexosOS,
  listarComentariosOS,
  listarHistoricoOS,
  listarResponsaveis,
  movimentarOS,
  obterUrlAssinadaAnexo,
  OS_AREAS,
  OS_PRIORIDADES,
  podeAtribuirOS,
  podeEditarOS,
  podeEncerrarOS,
  podeExecutarOS,
  podeExcluirOS,
  prioridadeLabel,
  prioridadeTone,
  areaLabel,
  registrarExecucaoOS,
  statusLabel,
  statusTone,
  uploadAnexoOS
} from '../services/osService.js';
import { listarSstVinculosOS } from '../services/sstService.js';
import {
  buscarRespostaRelatorioOS,
  listarModelosRelatorio,
  salvarRelatorioTecnicoOS,
  resumoRelatorioTecnico
} from '../services/relatorioTecnicoService.js';
import { ativoStatusLabel, ATIVO_STATUS, normalizeAtivoStatus } from '../services/ativosService.js';
import { baixarBlobComoArquivo, gerarNumeroDocumento, gerarPdfDeElemento, gerarQrCodeDocumento, salvarPdfArquivo } from '../services/pdfService.js';

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
  const [sstVinculos, setSstVinculos] = useState({ aprs: [], apts: [], inspecoes: [], ocorrencias: [], planos: [] });
  const [modelosRelatorio, setModelosRelatorio] = useState([]);
  const [respostaRelatorio, setRespostaRelatorio] = useState(null);
  const [responsaveis, setResponsaveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [execucao, setExecucao] = useState({ relatorio_tecnico: '', materiais_utilizados: '', pendencias: '', concluir: false, tecnicos_participantes: [] });
  const [relatorioTecnico, setRelatorioTecnico] = useState({ modelo_id: '', respostas: {}, fotos: {}, observacoes: '' });
  const [encerramento, setEncerramento] = useState({ status: 'concluida_arquivada', descricao: '', motivo_cancelamento: '', impacto_equipamento: 'operando', motivo_impacto: '' });
  const [workflowAction, setWorkflowAction] = useState(null);
  const [workflowForm, setWorkflowForm] = useState({ status: '', comentario: '', motivo: '', status_ativo_final: 'operando', motivo_impacto: '' });
  const [upload, setUpload] = useState({ file: null, legenda: '' });
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', tone: 'cyan' });
  const pdfRef = useRef(null);
  const [pdfData, setPdfData] = useState(null);

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [osData, historicoRows, comentariosRows, anexosRows, responsavelRows, sstRows] = await Promise.all([
        buscarOS(id),
        listarHistoricoOS(id),
        listarComentariosOS(id),
        listarAnexosOS(id),
        listarResponsaveis(),
        listarSstVinculosOS(id)
      ]);
      setOs(osData);
      setHistorico(historicoRows);
      setComentarios(comentariosRows);
      setAnexos(anexosRows);
      setResponsaveis(responsavelRows);
      setSstVinculos(sstRows);

      const [modelosAreaRows, respostaRows] = await Promise.all([
        listarModelosRelatorio({ area: osData.area, tipoManutencao: osData.tipo_manutencao, equipamentoTipo: osData.ativo?.tipo || osData.equipamento?.nome }),
        buscarRespostaRelatorioOS(id)
      ]);
      const modelosRows = modelosAreaRows.length ? modelosAreaRows : await listarModelosRelatorio();
      setModelosRelatorio(modelosRows);
      setRespostaRelatorio(respostaRows);
    } catch (err) {
      setError(err.message || 'Falha ao carregar OS.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [id]);

  useEffect(() => {
    if (!modelosRelatorio.length && !respostaRelatorio) return;
    const modeloId = respostaRelatorio?.modelo_id || modelosRelatorio[0]?.id || '';
    setRelatorioTecnico({
      modelo_id: modeloId,
      respostas: respostaRelatorio?.respostas || {},
      fotos: {},
      observacoes: respostaRelatorio?.observacoes || ''
    });
  }, [modelosRelatorio, respostaRelatorio]);

  function openEdit() {
    setForm({
      ebap_id: os.ebap_id || '',
      equipamento_id: os.equipamento_id || '',
      titulo: os.titulo || '',
      descricao: os.descricao || '',
      prioridade: os.prioridade || 'media',
      status: os.status || 'solicitada_prefeitura',
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

  function openWorkflow(action) {
    setWorkflowAction(action);
    setWorkflowForm({ status: action.to, comentario: '', motivo: '', status_ativo_final: 'operando', motivo_impacto: '' });
    setModal('workflow');
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
      let relatorioSalvo = null;
      if (relatorioTecnico.modelo_id) {
        relatorioSalvo = await salvarRelatorioTecnicoOS(
          id,
          {
            ...relatorioTecnico,
            ativo_id: os.ativo_id || null,
            ativo_nome: os.ativo?.nome_operacional || os.payload?.equipamento_falha || os.equipamento?.nome || os.titulo,
            observacoes: execucao.relatorio_tecnico || relatorioTecnico.observacoes
          },
          user,
          execucao.concluir ? 'enviado_supervisor' : 'rascunho'
        );

        const fotos = Object.entries(relatorioTecnico.fotos || {}).filter(([, foto]) => foto?.file);
        for (const [chave, foto] of fotos) {
          await uploadAnexoOS(id, foto.file, user, foto.legenda || foto.label || chave, foto.categoria || 'relatorio_tecnico_foto');
        }
      }

      await registrarExecucaoOS(id, execucao, user);
      setToast({
        message: relatorioSalvo
          ? (execucao.concluir ? 'Relatório técnico enviado ao Supervisor.' : 'Rascunho técnico salvo.')
          : (execucao.concluir ? 'Execução concluída e enviada para aprovação.' : 'Execução registrada.'),
        tone: 'green'
      });
      setExecucao({ relatorio_tecnico: '', materiais_utilizados: '', pendencias: '', concluir: false, tecnicos_participantes: [] });
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

  async function handleWorkflow(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await movimentarOS(id, workflowForm, user);
      setToast({ message: 'Movimentação registrada com rastreabilidade.', tone: workflowAction?.requiresMotivo ? 'orange' : 'green' });
      setModal(null);
      setWorkflowAction(null);
      setWorkflowForm({ status: '', comentario: '', motivo: '', status_ativo_final: 'operando', motivo_impacto: '' });
      await loadAll();
    } catch (err) {
      setError(err.message || 'Falha ao movimentar OS.');
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

  async function handleDeleteOS() {
    const confirmed = window.confirm(`Excluir a OS ${os.numero}? Ela sairá da lista, mas o histórico será mantido.`);
    if (!confirmed) return;

    setSaving(true);
    setError('');
    try {
      await excluirOS(id, user);
      setToast({ message: 'OS excluída.', tone: 'orange' });
      navigate('/os');
    } catch (err) {
      setError(err.message || 'Falha ao excluir OS.');
    } finally {
      setSaving(false);
    }
  }

  async function handleGerarPdf() {
    if (!os?.id) return;
    setSaving(true);
    setError('');
    try {
      const documentNumber = gerarNumeroDocumento('PDF-OS');
      const emittedAt = new Date().toISOString();
      const fotos = await Promise.all(
        anexos
          .filter((anexo) => String(anexo.mime_type || '').startsWith('image/'))
          .map(async (anexo) => ({ ...anexo, url: await obterUrlAssinadaAnexo(anexo) }))
      );
      const qrCode = await gerarQrCodeDocumento({ documentNumber, entityType: 'ordem_servico', entityId: os.id });
      setPdfData({
        type: 'os',
        documentNumber,
        emittedAt,
        qrCode,
        data: {
          os,
          historico,
          comentarios,
          relatorioTecnico: respostaRelatorio,
          fotos,
          areaLabel: areaLabel(os.area)
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 80));
      const blob = await gerarPdfDeElemento(pdfRef.current, { title: `OS ${os.numero}` });
      await salvarPdfArquivo({
        blob,
        documentNumber,
        entityType: 'ordem_servico',
        entityId: os.id,
        title: `Ordem de Serviço ${os.numero}`,
        userId: user?.id
      });
      await baixarBlobComoArquivo(blob, `${documentNumber}.pdf`);
      setToast({ message: 'PDF da OS gerado e arquivado.', tone: 'green' });
    } catch (err) {
      setError(err.message || 'Falha ao gerar PDF da OS.');
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
  const canSchedule = podeAtribuirOS(user?.perfil) && ['analise_supervisor', 'nao_conforme'].includes(os.status);
  const equipeExecutora = os.equipe_responsavel || os.equipe || '';
  const equipesTecnicas = listarEquipesTecnicas();
  const tecnicosEquipe = responsaveis.filter((responsavel) => responsavel.perfil === 'tecnico' && responsavel.equipe === equipeExecutora);
  const tecnicosParticipantes = Array.isArray(execucao.tecnicos_participantes) ? execucao.tecnicos_participantes : [];
  const canExecute = podeExecutarOS(user?.perfil, os, user) && ['encaminhada_tecnicos', 'em_execucao'].includes(os.status);
  const canClose = podeEncerrarOS(user?.perfil);
  const canDelete = podeExcluirOS(user?.perfil);
  const workflowActions = getWorkflowActions(user?.perfil, os);
  const equipamentoFalha = os.payload?.equipamento_falha || os.ativo?.nome_operacional || os.equipamento?.nome || '-';
  const isFinalizacaoComAtivo = Boolean(os.ativo_id);

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
            <button className="secondary-button" type="button" onClick={handleGerarPdf} disabled={saving}>
              <Download size={17} />
              PDF
            </button>
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
            {workflowActions.map((action) => (
              <button
                key={action.to}
                className={action.requiresMotivo ? 'secondary-button' : 'primary-button'}
                type="button"
                onClick={() => openWorkflow(action)}
              >
                <CheckCircle2 size={17} />
                {action.label}
              </button>
            ))}
            {canDelete && (
              <button className="danger-button" type="button" onClick={handleDeleteOS} disabled={saving}>
                <Trash2 size={17} />
                Excluir
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
          <Info label="Área" value={areaLabel(os.area)} />
          <Info label="EBAP" value={os.ebap?.nome || '-'} />
          <Info label="Ativo" value={os.ativo?.nome_operacional || '-'} />
          <Info label="Status do ativo" value={os.ativo ? ativoStatusLabel(os.ativo.status_operacional) : '-'} />
          <Info label="Tipo de manutenção" value={os.tipo_manutencao || '-'} />
          <Info label="Equipamento com falha" value={equipamentoFalha} />
          <Info label="Solicitante" value={os.solicitante?.nome || '-'} />
          <Info label="Responsável" value={os.responsavel?.nome || '-'} />
          <Info label="Programação" value={os.data_programada ? `${formatDate(os.data_programada)} ${os.hora_programada || ''}` : '-'} />
          <Info label="Criada em" value={formatDate(os.created_at)} />
        </div>
      </section>

      <section className="glass-card rounded-3xl p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-black text-white">Relatório técnico da OS</h3>
            <p className="text-sm text-slate-300">{resumoRelatorioTecnico(respostaRelatorio)}</p>
          </div>
          {respostaRelatorio?.status && (
            <StatusBadge tone={respostaRelatorio.status === 'enviado_supervisor' ? 'orange' : respostaRelatorio.status === 'aprovado_supervisor' ? 'green' : 'cyan'}>
              {respostaRelatorio.status.replaceAll('_', ' ')}
            </StatusBadge>
          )}
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
        <h3 className="mb-4 text-xl font-black text-white">SST vinculado à OS</h3>
        <SstLinkedCards vinculos={sstVinculos} />
      </section>

      <section className="glass-card rounded-3xl p-5">
        <h3 className="mb-4 text-xl font-black text-white">Timeline e histórico</h3>
        <OSTimeline historico={historico} statusAtual={os.status} />
      </section>

      <Modal open={modal === 'edit'} title="Editar OS" onClose={() => setModal(null)}>
        <form className="grid gap-4" onSubmit={handleEdit}>
          <div className="grid gap-4 md:grid-cols-2">
            <OSEquipmentSelector ebapId={form.ebap_id} equipamentoId={form.equipamento_id} onChange={(patch) => setForm((current) => ({ ...current, ...patch }))} />
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
            <label className="field-label">
              Área de atuação
              <select className="form-control" value={form.area || ''} onChange={(event) => updateForm('area', event.target.value)} required>
                <option value="">Selecione...</option>
                {OS_AREAS.map((area) => (
                  <option key={area.value} value={area.value}>
                    {area.label}
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
            <label className="field-label md:col-span-2">
              Equipe responsável
              <select className="form-control" value={form.equipe_responsavel || ''} onChange={(event) => updateForm('equipe_responsavel', event.target.value)} required>
                <option value="">Selecione...</option>
                {equipesTecnicas.map((equipe) => (
                  <option key={equipe.value} value={equipe.value}>{equipe.label}</option>
                ))}
              </select>
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
          <RelatorioTecnicoDinamico
            modelos={modelosRelatorio}
            value={relatorioTecnico}
            onChange={setRelatorioTecnico}
            disabled={saving}
          />
          <label className="field-label">
            Observação geral da execução
            <textarea className="form-control min-h-28 py-3" value={execucao.relatorio_tecnico} onChange={(event) => setExecucao((current) => ({ ...current, relatorio_tecnico: event.target.value }))} required={!relatorioTecnico.modelo_id} />
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
          {execucao.concluir && tecnicosEquipe.length > 0 && (
            <div className="grid gap-3 rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4">
              <div>
                <strong className="text-white">Técnicos participantes</strong>
                <p className="text-sm text-slate-300">Seleção opcional dos técnicos da {equipeTecnicaLabel(equipeExecutora)} que participaram da execução.</p>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {tecnicosEquipe.map((tecnico) => (
                  <label key={tecnico.id} className="flex items-center gap-3 rounded-xl border border-cyan-300/10 bg-navy-950/50 p-3 text-sm font-bold text-slate-200">
                    <input
                      type="checkbox"
                      checked={tecnicosParticipantes.includes(tecnico.id)}
                      onChange={(event) => setExecucao((current) => {
                        const selected = new Set(current.tecnicos_participantes || []);
                        if (event.target.checked) selected.add(tecnico.id); else selected.delete(tecnico.id);
                        return { ...current, tecnicos_participantes: Array.from(selected) };
                      })}
                    />
                    {tecnico.nome}
                  </label>
                ))}
              </div>
            </div>
          )}
          <Actions saving={saving} onCancel={() => setModal(null)} label="Salvar execução" />
        </form>
      </Modal>

      <Modal open={modal === 'close'} title="Encerrar OS" onClose={() => setModal(null)}>
        <form className="grid gap-4" onSubmit={handleEncerramento}>
          <label className="field-label">
            Status final
            <select className="form-control" value={encerramento.status} onChange={(event) => setEncerramento((current) => ({ ...current, status: event.target.value }))}>
              <option value="concluida_arquivada">Concluída / Arquivada</option>
              <option value="nao_conforme">Não conforme</option>
              <option value="rejeitada">Rejeitada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </label>
          <label className="field-label">
            Parecer do encerramento
            <textarea className="form-control min-h-28 py-3" value={encerramento.descricao} onChange={(event) => setEncerramento((current) => ({ ...current, descricao: event.target.value }))} required />
          </label>
          {encerramento.status !== 'concluida_arquivada' && (
            <label className="field-label">
              Motivo
              <textarea className="form-control min-h-24 py-3" value={encerramento.motivo_cancelamento} onChange={(event) => setEncerramento((current) => ({ ...current, motivo_cancelamento: event.target.value }))} required />
            </label>
          )}
          {isFinalizacaoComAtivo && encerramento.status === 'concluida_arquivada' && (
            <div className="grid gap-4 rounded-2xl border border-cyan-300/15 bg-navy-950/50 p-4">
              <label className="field-label">
                Qual o status atual do equipamento após a execução?
                <select className="form-control" value={encerramento.impacto_equipamento} onChange={(event) => setEncerramento((current) => ({ ...current, impacto_equipamento: event.target.value }))}>
                  {ATIVO_STATUS.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </label>
              {encerramento.impacto_equipamento !== 'sem_alteracao' && (
                <label className="field-label">
                  Motivo da alteração do status do ativo
                  <textarea className="form-control min-h-24 py-3" value={encerramento.motivo_impacto} onChange={(event) => setEncerramento((current) => ({ ...current, motivo_impacto: event.target.value }))} required />
                </label>
              )}
            </div>
          )}
          <Actions saving={saving} onCancel={() => setModal(null)} label="Confirmar encerramento" />
        </form>
      </Modal>

      <Modal open={modal === 'workflow'} title="Movimentar OS" onClose={() => setModal(null)}>
        <form className="grid gap-4" onSubmit={handleWorkflow}>
          <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4">
            <small className="block text-xs font-black uppercase tracking-wide text-slate-400">Nova etapa</small>
            <strong className="mt-1 block text-lg text-white">{statusLabel(workflowForm.status)}</strong>
            {workflowAction?.descricao && <p className="mt-2 text-sm text-slate-300">{workflowAction.descricao}</p>}
          </div>
          <label className="field-label">
            Comentário da etapa
            <textarea
              className="form-control min-h-24 py-3"
              value={workflowForm.comentario}
              onChange={(event) => setWorkflowForm((current) => ({ ...current, comentario: event.target.value }))}
              placeholder="Registre orientação, análise, execução ou observação desta movimentação."
            />
          </label>
          {workflowAction?.requiresMotivo && (
            <label className="field-label">
              Motivo obrigatório
              <textarea
                className="form-control min-h-24 py-3"
                value={workflowForm.motivo}
                onChange={(event) => setWorkflowForm((current) => ({ ...current, motivo: event.target.value }))}
                placeholder="Descreva o motivo da devolução ou não conformidade."
                required
              />
            </label>
          )}
          {os?.ativo_id && workflowForm.status === 'concluida_arquivada' && (
            <div className="grid gap-4 rounded-2xl border border-cyan-300/15 bg-navy-950/50 p-4">
              <label className="field-label">
                Qual o status atual do equipamento após a execução?
                <select
                  className="form-control"
                  value={workflowForm.status_ativo_final}
                  onChange={(event) => setWorkflowForm((current) => ({ ...current, status_ativo_final: event.target.value }))}
                  required
                >
                  {ATIVO_STATUS.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                Motivo da alteração do status do ativo
                <textarea
                  className="form-control min-h-24 py-3"
                  value={workflowForm.motivo_impacto}
                  onChange={(event) => setWorkflowForm((current) => ({ ...current, motivo_impacto: event.target.value }))}
                  placeholder="Informe o resultado operacional observado após a execução."
                  required
                />
              </label>
            </div>
          )}
          <Actions saving={saving} onCancel={() => setModal(null)} label="Registrar movimentação" />
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
      <div className="pointer-events-none fixed left-[-10000px] top-0">
        <div ref={pdfRef}>{pdfData && <PdfTemplate {...pdfData} />}</div>
      </div>
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

function SstLinkedCards({ vinculos }) {
  const groups = [
    { key: 'aprs', label: 'APR', rows: vinculos.aprs, getTitle: (row) => `${row.codigo} - ${row.atividade}` },
    { key: 'apts', label: 'APT', rows: vinculos.apts, getTitle: (row) => `${row.codigo} - ${row.atividade}` },
    { key: 'inspecoes', label: 'Inspeções', rows: vinculos.inspecoes, getTitle: (row) => `${row.codigo} - ${row.tipo}` },
    { key: 'ocorrencias', label: 'Ocorrências', rows: vinculos.ocorrencias, getTitle: (row) => `${row.codigo} - ${row.tipo?.replaceAll('_', ' ')}` },
    { key: 'planos', label: 'Planos de ação', rows: vinculos.planos, getTitle: (row) => `${row.codigo} - ${row.descricao}` }
  ];
  const total = groups.reduce((sum, group) => sum + group.rows.length, 0);

  if (!total) {
    return <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4 text-sm text-slate-300">Nenhum documento SST vinculado a esta OS.</div>;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {groups.map((group) => (
        <div key={group.key} className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4">
          <div className="mb-3 flex items-center justify-between">
            <strong className="text-white">{group.label}</strong>
            <span className="rounded-full border border-cyan-300/25 px-3 py-1 text-xs font-black text-cyan-100">{group.rows.length}</span>
          </div>
          <div className="grid gap-2">
            {group.rows.length ? group.rows.slice(0, 4).map((row) => (
              <div key={row.id} className="rounded-xl bg-navy-950/50 p-3">
                <strong className="block truncate text-sm text-white">{group.getTitle(row)}</strong>
                <small className="text-slate-400">Status: {row.status?.replaceAll('_', ' ') || '-'}</small>
              </div>
            )) : <span className="text-sm text-slate-400">Sem registros.</span>}
          </div>
        </div>
      ))}
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
