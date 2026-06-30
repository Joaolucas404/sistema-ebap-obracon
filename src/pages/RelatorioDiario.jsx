import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Download, Eye, RefreshCcw, Save, X, XCircle } from 'lucide-react';
import PdfTemplate from '../components/pdf/PdfTemplate.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import Toast from '../components/ui/Toast.jsx';
import RelatorioStepper from '../components/relatorio/RelatorioStepper.jsx';
import RelatorioOperacao from '../components/relatorio/RelatorioOperacao.jsx';
import RelatorioBombas from '../components/relatorio/RelatorioBombas.jsx';
import RelatorioRastelos from '../components/relatorio/RelatorioRastelos.jsx';
import RelatorioComportas from '../components/relatorio/RelatorioComportas.jsx';
import RelatorioEletrocentro from '../components/relatorio/RelatorioEletrocentro.jsx';
import RelatorioGeradores from '../components/relatorio/RelatorioGeradores.jsx';
import RelatorioCCO from '../components/relatorio/RelatorioCCO.jsx';
import RelatorioOcorrencias from '../components/relatorio/RelatorioOcorrencias.jsx';
import RelatorioFotos from '../components/relatorio/RelatorioFotos.jsx';
import RelatorioResumo from '../components/relatorio/RelatorioResumo.jsx';
import { useAuthStore } from '../store/authStore.js';
import {
  blankPayload,
  alterarEbapRelatorio,
  buscarRascunhoOperador,
  cancelarRascunhoRelatorio,
  criarRascunhoRelatorio,
  finalizarRelatorio,
  listarEbapsRelatorio,
  listarEquipamentosRelatorio,
  listarFotosRelatorio,
  listarRelatoriosAnteriores,
  listarValidacoesRelatorio,
  obterUrlFotoRelatorio,
  prepararPayloadEquipamentos,
  ALERT_STATUS_VALUES,
  FOTO_CATEGORIAS_OBRIGATORIAS,
  RELATORIO_STEPS,
  salvarRascunhoRelatorio,
  uploadFotoRelatorio,
  validarRdoOperacional
} from '../services/relatorioService.js';
import { baixarBlobComoArquivo, gerarNumeroDocumento, gerarPdfDeElemento, gerarQrCodeDocumento, salvarPdfArquivo } from '../services/pdfService.js';

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('pt-BR');
}

function isEditableReport(status) {
  return ['rascunho', 'correcao_solicitada'].includes(status);
}

export default function RelatorioDiario() {
  const user = useAuthStore((state) => state.user);
  const canEdit = user?.perfil === 'operador';
  const operadorEbapId = canEdit ? user?.ebap_id : '';
  const [ebaps, setEbaps] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  const [relatorio, setRelatorio] = useState(null);
  const [payload, setPayload] = useState(blankPayload());
  const [currentStep, setCurrentStep] = useState('dados');
  const [fotos, setFotos] = useState([]);
  const [anteriores, setAnteriores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState('');
  const [error, setError] = useState('');
  const [progressOpen, setProgressOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', tone: 'cyan' });
  const autosaveTimer = useRef(null);
  const pdfRef = useRef(null);
  const [pdfData, setPdfData] = useState(null);

  const currentIndex = RELATORIO_STEPS.findIndex((step) => step.id === currentStep);
  const stepPendencias = useMemo(() => buildStepPendencias(payload, fotos), [payload, fotos]);
  const completedSteps = useMemo(
    () => RELATORIO_STEPS.filter((step) => (stepPendencias[step.id] || []).length === 0).map((step) => step.id),
    [stepPendencias]
  );
  const currentPendencias = stepPendencias[currentStep] || [];
  const canGoNext = currentPendencias.length === 0;

  function canAccessStep(stepId) {
    const targetIndex = RELATORIO_STEPS.findIndex((step) => step.id === stepId);
    if (targetIndex < 0) return false;
    if (targetIndex <= currentIndex) return true;
    return RELATORIO_STEPS.slice(0, targetIndex).every((step) => (stepPendencias[step.id] || []).length === 0);
  }

  function handleStepSelect(stepId) {
    if (canAccessStep(stepId)) {
      setError('');
      setCurrentStep(stepId);
      return true;
    }
    const targetIndex = RELATORIO_STEPS.findIndex((step) => step.id === stepId);
    const blocker = RELATORIO_STEPS.slice(0, Math.max(0, targetIndex)).find((step) => (stepPendencias[step.id] || []).length);
    const message = blocker
      ? `Conclua a etapa "${blocker.title}" antes de avançar. ${stepPendencias[blocker.id][0]}`
      : 'Conclua a etapa atual antes de avançar.';
    setError(message);
    setToast({ message, tone: 'orange' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return false;
  }

  const goNext = () => {
    if (currentIndex >= RELATORIO_STEPS.length - 1) return;
    if (!canGoNext) {
      const message = `Conclua esta etapa antes de avançar. ${currentPendencias[0]}`;
      setError(message);
      setToast({ message, tone: 'orange' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setError('');
    setCurrentStep(RELATORIO_STEPS[currentIndex + 1].id);
  };

  const goPrevious = () => {
    if (currentIndex > 0) {
      setError('');
      setCurrentStep(RELATORIO_STEPS[currentIndex - 1].id);
    }
  };

  const currentStepNumber = Math.max(1, currentIndex + 1);
  const progress = RELATORIO_STEPS.length ? Math.round((completedSteps.length / RELATORIO_STEPS.length) * 100) : 0;
  const currentStepInfo = RELATORIO_STEPS[currentIndex] || RELATORIO_STEPS[0];
  const operationalSummary = useMemo(() => buildOperationalSummary(payload, fotos, equipamentos, relatorio, ebaps), [payload, fotos, equipamentos, relatorio, ebaps]);

  async function loadInitial() {
    setLoading(true);
    setError('');
    try {
      const [ebapRows, draft, history] = await Promise.all([
        listarEbapsRelatorio(),
        canEdit ? buscarRascunhoOperador(user?.id) : Promise.resolve(null),
        listarRelatoriosAnteriores({ perfil: user?.perfil, userId: user?.id })
      ]);
      setEbaps(ebapRows);
      setAnteriores(history.data);
      if (draft) {
        setRelatorio(draft);
        setPayload(draft.payload || blankPayload());
        setFotos(await listarFotosRelatorio(draft.id));
        if (draft.ebap_id) await loadEquipamentos(draft.ebap_id, draft.payload || blankPayload());
      } else if (canEdit && operadorEbapId) {
        const current = await criarRascunhoRelatorio({ ebapId: operadorEbapId, user });
        setRelatorio(current);
        await loadEquipamentos(operadorEbapId, current.payload || blankPayload());
        setToast({ message: 'RDO iniciado automaticamente na EBAP do operador.', tone: 'green' });
      } else if (canEdit && !operadorEbapId) {
        setError('Seu usuário operador ainda não possui EBAP vinculada. Solicite à administração para preencher a EBAP no cadastro do usuário.');
      }
    } catch (err) {
      setError(err.message || 'Falha ao carregar RDO.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInitial();
  }, [user?.id, user?.perfil, operadorEbapId]);

  useEffect(() => {
    if (!canEdit || !relatorio?.id || !isEditableReport(relatorio.status)) return;
    clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      saveDraft(false);
    }, 1200);
    return () => clearTimeout(autosaveTimer.current);
  }, [payload, currentStep, relatorio?.id, relatorio?.status]);

  async function loadEquipamentos(ebapId, basePayload = payload) {
    const rows = await listarEquipamentosRelatorio(ebapId);
    setEquipamentos(rows);
    setPayload(prepararPayloadEquipamentos(basePayload, rows));
  }

  async function handleSelectEbap(ebapId) {
    if (!canEdit) return;
    if (operadorEbapId && ebapId !== operadorEbapId) {
      setError('Operador só pode preencher RDO da EBAP vinculada ao seu cadastro.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      let current = relatorio;
      if (!current) {
        current = await criarRascunhoRelatorio({ ebapId, user });
        setRelatorio(current);
      } else {
        current = current.ebap_id === ebapId ? await salvarRascunhoRelatorio(current.id, payload) : await alterarEbapRelatorio(current.id, ebapId);
      }
      await loadEquipamentos(ebapId, current.payload || payload);
      setRelatorio({ ...current, ebap_id: ebapId });
      setToast({ message: 'EBAP selecionada. Rascunho iniciado.', tone: 'green' });
    } catch (err) {
      setError(err.message || 'Falha ao selecionar EBAP.');
    } finally {
      setSaving(false);
    }
  }

  async function visualizarRelatorioAnterior(item) {
    setRelatorio(item);
    setPayload(item.payload || blankPayload());
    setCurrentStep('revisao');
    setFotos(await listarFotosRelatorio(item.id));
    if (item.ebap_id) await loadEquipamentos(item.ebap_id, item.payload || blankPayload());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateSection(section, data) {
    setPayload((current) => ({ ...current, [section]: data }));
  }

  async function saveDraft(showToast = true) {
    if (!relatorio?.id || !canEdit || !isEditableReport(relatorio.status)) return;
    setSaving(true);
    try {
      const saved = await salvarRascunhoRelatorio(relatorio.id, payload);
      setRelatorio(saved);
      setLastSaved(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      if (showToast) setToast({ message: 'Rascunho salvo.', tone: 'green' });
    } catch (err) {
      setError(err.message || 'Falha ao salvar rascunho.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCancelarRdo() {
    if (!relatorio?.id || !canEdit || !isEditableReport(relatorio.status)) return;
    const confirmed = window.confirm('Cancelar este RDO? O rascunho será descartado e você poderá iniciar outro depois.');
    if (!confirmed) return;

    clearTimeout(autosaveTimer.current);
    setSaving(true);
    setError('');
    try {
      await cancelarRascunhoRelatorio(relatorio.id, user);
      setRelatorio(null);
      setPayload(blankPayload());
      setFotos([]);
      setEquipamentos([]);
      setCurrentStep('dados');
      setLastSaved('');
      const history = await listarRelatoriosAnteriores({ perfil: user?.perfil, userId: user?.id });
      setAnteriores(history.data);
      setToast({ message: 'RDO cancelado.', tone: 'orange' });
    } catch (err) {
      setError(err.message || 'Falha ao cancelar RDO.');
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadFoto(file, legenda, categoria) {
    if (!relatorio?.id) throw new Error('Inicie um relatório antes de enviar fotos.');
    const foto = await uploadFotoRelatorio(relatorio.id, file, user, legenda, categoria);
    setFotos(await listarFotosRelatorio(relatorio.id));
    setToast({ message: 'Foto enviada.', tone: 'green' });
    return foto;
  }

  async function handleFinalizar() {
    if (!relatorio?.id) return;
    setSaving(true);
    setError('');
    try {
      const pendencias = validarRdoOperacional(payload, fotos);
      if (pendencias.length) throw new Error(pendencias.join(' '));
      const finalizado = await finalizarRelatorio(relatorio.id, payload, fotos);
      setRelatorio(finalizado);
      setToast({ message: 'Relatório finalizado e enviado para validação CCO.', tone: 'green' });
      const history = await listarRelatoriosAnteriores({ perfil: user?.perfil, userId: user?.id });
      setAnteriores(history.data);
    } catch (err) {
      setError(err.message || 'Falha ao finalizar relatório.');
    } finally {
      setSaving(false);
    }
  }

  async function handleGerarPdf() {
    if (!relatorio?.id) return;
    setSaving(true);
    setError('');
    try {
      const documentNumber = gerarNumeroDocumento('PDF-RDO');
      const emittedAt = new Date().toISOString();
      const [signedFotos, validacoes] = await Promise.all([
        Promise.all(fotos.map(async (foto) => ({ ...foto, url: await obterUrlFotoRelatorio(foto) }))),
        listarValidacoesRelatorio(relatorio.id)
      ]);
      const qrCode = await gerarQrCodeDocumento({ documentNumber, entityType: 'relatorio_diario', entityId: relatorio.id });
      setPdfData({
        type: 'ro',
        documentNumber,
        emittedAt,
        qrCode,
        data: {
          relatorio: { ...relatorio, payload },
          fotos: signedFotos,
          validacoes
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 80));
      const blob = await gerarPdfDeElemento(pdfRef.current, { title: `RDO ${relatorio.codigo}` });
      await salvarPdfArquivo({
        blob,
        documentNumber,
        entityType: 'relatorio_diario',
        entityId: relatorio.id,
        title: `RDO ${relatorio.codigo}`,
        userId: user?.id
      });
      await baixarBlobComoArquivo(blob, `${documentNumber}.pdf`);
      setToast({ message: 'PDF do RDO gerado e arquivado.', tone: 'green' });
    } catch (err) {
      setError(err.message || 'Falha ao gerar PDF do relatório.');
    } finally {
      setSaving(false);
    }
  }

  function renderStep() {
    if (currentStep === 'dados') return <RelatorioOperacao data={payload.dados} onChange={(data) => updateSection('dados', data)} />;
    if (currentStep === 'bombas') return <RelatorioBombas data={payload.bombas} onChange={(data) => updateSection('bombas', data)} />;
    if (currentStep === 'rastelos') return <RelatorioRastelos data={payload.rastelos} onChange={(data) => updateSection('rastelos', data)} />;
    if (currentStep === 'comportas') return <RelatorioComportas data={payload.comportas} onChange={(data) => updateSection('comportas', data)} />;
    if (currentStep === 'eletrocentro') return <RelatorioEletrocentro data={payload.eletrocentro} onChange={(data) => updateSection('eletrocentro', data)} />;
    if (currentStep === 'geradores') return <RelatorioGeradores data={payload.geradores} onChange={(data) => updateSection('geradores', data)} />;
    if (currentStep === 'cco') return <RelatorioCCO data={payload.cco} onChange={(data) => updateSection('cco', data)} />;
    if (currentStep === 'ocorrencias') return <RelatorioOcorrencias data={payload.ocorrencias} onChange={(data) => updateSection('ocorrencias', data)} />;
    if (currentStep === 'fotos') return <RelatorioFotos fotos={fotos} data={payload.fotos} payload={payload} onChange={(data) => updateSection('fotos', data)} onUpload={handleUploadFoto} disabled={!canEdit || !relatorio?.id || !isEditableReport(relatorio?.status)} />;
    return <RelatorioResumo relatorio={relatorio} payload={payload} fotos={fotos} />;
  }

  if (loading) {
    return <div className="glass-card rounded-3xl p-8 text-center text-slate-300">Carregando RDO...</div>;
  }

  return (
    <div className="grid gap-4 pb-24 sm:pb-0">
      <div className="hidden sm:block">
        <PageHeader
          title="RDO - Relatório Diário Operacional"
          description="RDO completo com checklist por equipamento, salvamento automático, fotos e finalização para validação CCO."
          actions={
            <>
              <button className="secondary-button" type="button" onClick={loadInitial}>
                <RefreshCcw size={17} />
                Atualizar
              </button>
              {relatorio?.id && (
                <button className="secondary-button" type="button" onClick={handleGerarPdf} disabled={saving}>
                  <Download size={17} />
                  PDF
                </button>
              )}
              {canEdit && isEditableReport(relatorio?.status) && (
                <button className="danger-button" type="button" onClick={handleCancelarRdo} disabled={saving || !relatorio?.id}>
                  <XCircle size={17} />
                  Cancelar
                </button>
              )}
              {canEdit && isEditableReport(relatorio?.status) && (
                <button className="secondary-button" type="button" onClick={() => saveDraft(true)} disabled={saving || !relatorio?.id}>
                  <Save size={17} />
                  Salvar
                </button>
              )}
              {canEdit && isEditableReport(relatorio?.status) && (
                <button className="primary-button" type="button" onClick={handleFinalizar} disabled={saving || !relatorio?.id}>
                  <CheckCircle2 size={17} />
                  Finalizar
                </button>
              )}
            </>
          }
        />
      </div>

      <MobileRdoHeader
        relatorio={relatorio}
        saving={saving}
        canEdit={canEdit}
        onRefresh={loadInitial}
        onSave={() => saveDraft(true)}
        onCancel={handleCancelarRdo}
        onFinalize={handleFinalizar}
      />

      {error && <div className="rounded-2xl border border-red-300/30 bg-red-500/15 p-4 text-sm font-bold text-red-100">{error}</div>}

      <section className="glass-card rounded-3xl p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <label className="field-label">
            EBAP
            <select
              className="form-control"
              value={relatorio?.ebap_id || operadorEbapId || ''}
              onChange={(event) => handleSelectEbap(event.target.value)}
              disabled={!canEdit || Boolean(operadorEbapId) || (relatorio?.status && !isEditableReport(relatorio.status))}
            >
              <option value="">Selecione uma EBAP para iniciar...</option>
              {ebaps.map((ebap) => (
                <option key={ebap.id} value={ebap.id}>
                  {ebap.nome}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={relatorio?.status === 'rascunho' ? 'orange' : relatorio?.status ? 'green' : 'slate'}>
              {relatorio?.status || 'sem relatório ativo'}
            </StatusBadge>
            {lastSaved && <StatusBadge>salvo às {lastSaved}</StatusBadge>}
            <StatusBadge>{equipamentos.length} equipamento(s)</StatusBadge>
          </div>
        </div>
      </section>
      <OperationalSummary summary={operationalSummary} />

      {relatorio?.id ? (
        <>
          <MobileRdoProgress
            step={currentStepInfo}
            currentStepNumber={currentStepNumber}
            total={RELATORIO_STEPS.length}
            progress={progress}
            lastSaved={lastSaved}
            saving={saving}
            onOpen={() => setProgressOpen(true)}
          />
          <div className="hidden sm:block">
            <RelatorioStepper
              steps={RELATORIO_STEPS}
              currentStep={currentStep}
              completedSteps={completedSteps}
              onStepClick={handleStepSelect}
              canAccessStep={canAccessStep}
            />
          </div>
          {currentPendencias.length > 0 && (
            <div className="rounded-2xl border border-amber-300/25 bg-amber-500/10 p-4 text-sm font-bold text-amber-100">
              Para avançar, conclua esta etapa: {currentPendencias[0]}
            </div>
          )}
          {renderStep()}
          <WizardNavigation
            currentIndex={currentIndex}
            total={RELATORIO_STEPS.length}
            onPrevious={goPrevious}
            onNext={goNext}
            canGoNext={canGoNext}
            nextMessage={currentPendencias[0]}
          />
          <ProgressModal
            open={progressOpen}
            steps={RELATORIO_STEPS}
            currentStep={currentStep}
            completedSteps={completedSteps}
            canAccessStep={canAccessStep}
            onClose={() => setProgressOpen(false)}
            onSelect={(stepId) => {
              if (handleStepSelect(stepId)) setProgressOpen(false);
            }}
          />
        </>
      ) : (
        <div className="glass-card rounded-3xl p-8 text-center text-slate-300">
          Selecione uma EBAP para criar ou carregar o rascunho do RDO.
        </div>
      )}

      <section className="glass-card rounded-3xl p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-white">Histórico do operador</h3>
            <p className="text-sm text-slate-300">Relatórios anteriores disponíveis para visualização.</p>
          </div>
          <Eye className="text-cyan-200" size={22} />
        </div>
        <div className="grid gap-3">
          {anteriores.length ? (
            anteriores.map((item) => (
              <div key={item.id} className="grid gap-3 rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                <div>
                  <strong className="text-white">{item.codigo}</strong>
                  <p className="text-sm text-slate-300">{item.ebap?.nome || 'EBAP'} • {formatDate(item.created_at)}</p>
                </div>
                <StatusBadge tone={item.status === 'rascunho' ? 'orange' : 'green'}>{item.status}</StatusBadge>
                <button className="secondary-button" type="button" onClick={() => visualizarRelatorioAnterior(item)}>
                  Visualizar
                </button>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-5 text-sm text-slate-300">
              Nenhum relatório anterior encontrado.
            </div>
          )}
        </div>
      </section>

      <Toast message={toast.message} tone={toast.tone} onClose={() => setToast({ message: '', tone: 'cyan' })} />
      <div className="pointer-events-none fixed left-[-10000px] top-0">
        <div ref={pdfRef}>{pdfData && <PdfTemplate {...pdfData} />}</div>
      </div>
    </div>
  );
}


function buildStepPendencias(payload, fotos) {
  return RELATORIO_STEPS.reduce((acc, step) => {
    acc[step.id] = getStepPendencias(step.id, payload, fotos);
    return acc;
  }, {});
}

function getStepPendencias(stepId, payload, fotos) {
  if (stepId === 'dados') return validateDados(payload?.dados);
  if (['bombas', 'rastelos', 'comportas'].includes(stepId)) return validateItems(payload?.[stepId]?.items || []);
  if (stepId === 'eletrocentro') return validateEletrocentro(payload?.eletrocentro);
  if (stepId === 'geradores') return validateGeradores(payload?.geradores);
  if (stepId === 'cco') return validateCco(payload?.cco);
  if (stepId === 'ocorrencias') return validateOcorrencias(payload?.ocorrencias);
  if (stepId === 'fotos') return validateFotos(payload, fotos);
  if (stepId === 'revisao') {
    const previousSteps = RELATORIO_STEPS.filter((step) => step.id !== 'revisao');
    const pending = previousSteps.flatMap((step) => getStepPendencias(step.id, payload, fotos));
    return pending.length ? ['Conclua todas as etapas anteriores para revisar o RDO.'] : [];
  }
  return [];
}

function hasValue(value) {
  return String(value ?? '').trim().length > 0;
}

function validateDados(dados = {}) {
  const pendencias = [];
  if (!hasValue(dados.turno)) pendencias.push('Informe o turno.');
  if (!hasValue(dados.clima)) pendencias.push('Informe a condição climática.');
  const nivelMare = Number(dados.nivel_geral);
  if (!hasValue(dados.nivel_geral) || !Number.isFinite(nivelMare)) pendencias.push('Informe o nível de maré em metros.');
  return pendencias;
}

function validateItems(items = []) {
  return (items || []).flatMap((item, index) => {
    const nome = item?.nome || item?.descricao || `Equipamento ${index + 1}`;
    const pendencias = [];
    if (!hasValue(item?.status)) pendencias.push(`${nome}: informe o status.`);
    if (ALERT_STATUS_VALUES.includes(item?.status) && !hasValue(item?.observacao)) pendencias.push(`${nome}: informe o motivo.`);
    return pendencias;
  });
}

function validateEletrocentro(data = {}) {
  const pendencias = [];
  if (!['sim', 'nao'].includes(data?.sensores_possui)) pendencias.push('Informe se a EBAP possui sensores.');
  if (!['sim', 'nao'].includes(data?.climatizadores_possui)) pendencias.push('Informe se a EBAP possui climatizadores.');
  if (data?.sensores_possui === 'sim' && Number(data?.sensores_quantidade || 0) <= 0) pendencias.push('Informe a quantidade de sensores.');
  if (data?.climatizadores_possui === 'sim' && Number(data?.climatizadores_quantidade || 0) <= 0) pendencias.push('Informe a quantidade de climatizadores.');
  return [...pendencias, ...validateItems(data?.items || [])];
}

function validateGeradores(data = {}) {
  if (!['sim', 'nao'].includes(data?.possui)) return ['Informe se a EBAP possui gerador.'];
  if (data.possui !== 'sim') return [];

  const pendencias = [];
  if (Number(data?.quantidade || 0) <= 0) pendencias.push('Informe a quantidade de geradores.');
  (data?.items || []).forEach((item, index) => {
    const nome = item?.nome || `Gerador ${index + 1}`;
    if (!hasValue(item?.status)) pendencias.push(`${nome}: informe o status.`);
    if (ALERT_STATUS_VALUES.includes(item?.status) && !hasValue(item?.observacao)) pendencias.push(`${nome}: informe o motivo.`);
    const diesel = Number(item?.diesel);
    if (!Number.isFinite(diesel) || diesel < 0 || diesel > 100) pendencias.push(`${nome}: informe o nível de diesel entre 0% e 100%.`);
  });
  return pendencias;
}

function validateCco(data = {}) {
  const pendencias = [];
  if (!hasValue(data.comunicacao)) pendencias.push('Informe a comunicação com o CCO.');
  if (!hasValue(data.supervisao)) pendencias.push('Informe a supervisão.');
  return pendencias;
}

function validateOcorrencias(data = {}) {
  if (!['sim', 'nao'].includes(data?.houve)) return ['Informe se houve ocorrência.'];
  if (data.houve === 'sim' && !hasValue(data.descricao)) return ['Descreva a ocorrência registrada.'];
  return [];
}

function validateFotos(payload, fotos = []) {
  const categorias = new Set((fotos || []).map((foto) => foto.categoria));
  const pendencias = [];
  FOTO_CATEGORIAS_OBRIGATORIAS.forEach((categoria) => {
    if (!categorias.has(categoria.value)) pendencias.push(`Anexe: ${categoria.label}.`);
  });
  if (payload?.geradores?.possui === 'sim') {
    (payload?.geradores?.items || []).forEach((item, index) => {
      const categoria = `gerador_${index + 1}`;
      if (!categorias.has(categoria)) pendencias.push(`Anexe a foto do ${item?.nome || `Gerador ${index + 1}`}.`);
    });
  }
  return pendencias;
}

function buildOperationalSummary(payload, fotos, equipamentos, relatorio, ebaps) {
  const sections = ['bombas', 'rastelos', 'comportas', 'eletrocentro', 'geradores'];
  const items = sections.flatMap((section) => payload?.[section]?.items || []);
  const preenchidos = items.filter((item) => item.status && (!['atencao', 'parado', 'em_manutencao'].includes(item.status) || String(item.observacao || '').trim())).length;
  const total = items.length || equipamentos.length;
  const ebap = ebaps.find((row) => row.id === relatorio?.ebap_id);
  return {
    ebap: ebap?.nome || relatorio?.ebap?.nome || 'EBAP não selecionada',
    totalEquipamentos: total,
    preenchidos,
    pendentes: Math.max(0, total - preenchidos),
    fotos: fotos.length
  };
}

function MobileRdoHeader({ relatorio, saving, canEdit, onRefresh, onSave, onCancel, onFinalize }) {
  const canUpdate = canEdit && isEditableReport(relatorio?.status);

  return (
    <section className="rounded-[28px] border border-blue-200/15 bg-[#10224D]/80 p-4 shadow-lg shadow-black/20 sm:hidden">
      <span className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-200/70">RDO</span>
      <h1 className="mt-1 text-2xl font-black leading-tight text-white">Relatório Diário Operacional</h1>
      <p className="mt-1 text-sm font-semibold text-slate-300">Preenchimento rápido para operação de campo.</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className="secondary-button min-h-11 justify-center px-3" type="button" onClick={onRefresh}>
          <RefreshCcw size={16} />
          Atualizar
        </button>
        {canUpdate ? (
          <button className="secondary-button min-h-11 justify-center px-3" type="button" onClick={onSave} disabled={saving || !relatorio?.id}>
            <Save size={16} />
            Salvar
          </button>
        ) : (
          <StatusBadge tone={relatorio?.status ? 'blue' : 'slate'}>{relatorio?.status || 'sem RDO'}</StatusBadge>
        )}
      </div>
      {canUpdate && (
        <div className="mt-2 grid grid-cols-[0.9fr_1.1fr] gap-2">
          <button className="danger-button min-h-11 justify-center px-3" type="button" onClick={onCancel} disabled={saving || !relatorio?.id}>
            <XCircle size={16} />
            Cancelar
          </button>
          <button className="primary-button min-h-11 justify-center px-3" type="button" onClick={onFinalize} disabled={saving || !relatorio?.id}>
            <CheckCircle2 size={16} />
            Finalizar
          </button>
        </div>
      )}
    </section>
  );
}

function MobileRdoProgress({ step, currentStepNumber, total, progress, lastSaved, saving, onOpen }) {
  return (
    <section className="rounded-[26px] border border-blue-200/15 bg-[#10224D]/85 p-4 shadow-lg shadow-black/20 sm:hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-200/70">RDO Diário</span>
          <h2 className="mt-1 truncate text-2xl font-black text-white">{step?.title || 'Etapa atual'}</h2>
          <p className="mt-1 text-sm font-bold text-slate-300">
            Etapa {currentStepNumber} de {total}
          </p>
        </div>
        <button className="secondary-button min-h-10 shrink-0 px-3" type="button" onClick={onOpen}>
          Ver progresso
        </button>
      </div>
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs font-black text-slate-300">
          <span>{progress}% concluído</span>
          <span>{saving ? 'salvando...' : lastSaved ? `salvo às ${lastSaved}` : 'auto save ativo'}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[#0A1633] ring-1 ring-blue-200/10">
          <div className="h-full rounded-full bg-blue-500 transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </section>
  );
}

function ProgressModal({ open, steps, currentStep, completedSteps, canAccessStep, onClose, onSelect }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end bg-black/55 p-3 sm:hidden" role="dialog" aria-modal="true">
      <button className="absolute inset-0 cursor-default" type="button" onClick={onClose} aria-label="Fechar progresso" />
      <section className="relative max-h-[82dvh] w-full rounded-[28px] border border-blue-200/15 bg-[#10224D] shadow-2xl shadow-black/45">
        <header className="flex items-center justify-between border-b border-blue-200/10 p-4">
          <div>
            <h3 className="text-xl font-black text-white">Progresso do RDO</h3>
            <p className="text-sm font-semibold text-slate-300">Etapas futuras liberam após concluir as anteriores.</p>
          </div>
          <button className="grid size-10 place-items-center rounded-full bg-white/10 text-slate-200" type="button" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </header>
        <div className="grid max-h-[62dvh] gap-2 overflow-auto p-3">
          {steps.map((step) => {
            const isDone = completedSteps.includes(step.id);
            const isCurrent = currentStep === step.id;
            const isLocked = canAccessStep ? !canAccessStep(step.id) : false;
            return (
              <button
                key={step.id}
                className={`flex min-h-14 items-center gap-3 rounded-2xl border px-3 text-left ${
                  isCurrent ? 'border-blue-300/45 bg-blue-600/25' : isLocked ? 'border-blue-200/10 bg-[#0A1633]/45 opacity-60' : 'border-blue-200/10 bg-[#0A1633]/70'
                }`}
                type="button"
                disabled={isLocked}
                onClick={() => onSelect(step.id)}
              >
                <span className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-black ${isDone ? 'bg-blue-500 text-white' : isCurrent ? 'bg-white text-blue-700' : 'bg-white/10 text-slate-300'}`}>
                  {isDone ? '✓' : isCurrent ? '●' : '○'}
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-base font-black text-white">{step.title}</strong>
                  <small className="block text-xs font-bold text-slate-300">{isLocked ? 'Bloqueado' : isDone ? 'Concluído' : isCurrent ? 'Atual' : 'Pendente'}</small>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function OperationalSummary({ summary }) {
  return (
    <section className="glass-card rounded-[26px] p-3 shadow-lg shadow-navy-950/20 lg:sticky lg:top-2 lg:z-20 lg:rounded-3xl lg:p-4 lg:shadow-xl">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,0.8fr))] lg:gap-3">
        <SummaryInfo className="col-span-2 md:col-span-1" label="EBAP" value={summary.ebap} />
        <SummaryInfo label="Equipamentos" value={summary.totalEquipamentos} />
        <SummaryInfo label="Preenchidos" value={summary.preenchidos} tone="text-emerald-200" />
        <SummaryInfo label="Pendentes" value={summary.pendentes} tone={summary.pendentes ? 'text-amber-200' : 'text-emerald-200'} />
        <SummaryInfo label="Fotos" value={summary.fotos} tone="text-cyan-200" />
      </div>
    </section>
  );
}

function SummaryInfo({ label, value, tone = 'text-white', className = '' }) {
  return (
    <div className={['rounded-2xl border border-cyan-300/10 bg-navy-950/50 p-3', className].join(' ')}>
      <small className="block text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</small>
      <strong className={['mt-1 block truncate text-base font-black sm:text-lg', tone].join(' ')}>{value}</strong>
    </div>
  );
}

function WizardNavigation({ currentIndex, total, onPrevious, onNext, canGoNext = true, nextMessage = '' }) {
  const isFirst = currentIndex <= 0;
  const isLast = currentIndex >= total - 1;
  const nextDisabled = isLast || !canGoNext;
  return (
    <>
      <div className="mt-6 hidden justify-between gap-3 pb-2 sm:flex">
        <button type="button" className="secondary-button" onClick={onPrevious} disabled={isFirst}>
          <ArrowLeft size={17} />
          Anterior
        </button>
        <div className="grid justify-items-end gap-2">
          {nextDisabled && !isLast && nextMessage && <span className="max-w-md text-right text-xs font-bold text-amber-100">Preencha: {nextMessage}</span>}
          <button type="button" className="primary-button" onClick={onNext} disabled={nextDisabled}>
            Próximo
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
      <div className="fixed inset-x-4 bottom-24 z-40 mx-auto max-w-md rounded-[26px] border border-cyan-300/15 bg-navy-950/95 p-2 shadow-2xl sm:hidden">
        {nextDisabled && !isLast && nextMessage && <p className="mb-2 px-2 text-xs font-bold text-amber-100">Preencha: {nextMessage}</p>}
        <div className="grid grid-cols-[0.85fr_1.15fr] gap-2">
          <button type="button" className="secondary-button justify-center" onClick={onPrevious} disabled={isFirst}>
            <ArrowLeft size={17} />
            Anterior
          </button>
          <button type="button" className="primary-button justify-center" onClick={onNext} disabled={nextDisabled}>
            Próximo
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </>
  );
}
