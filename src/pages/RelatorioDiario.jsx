import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Download, Eye, RefreshCcw, Save } from 'lucide-react';
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
  criarRascunhoRelatorio,
  finalizarRelatorio,
  listarEbapsRelatorio,
  listarEquipamentosRelatorio,
  listarFotosRelatorio,
  listarRelatoriosAnteriores,
  listarValidacoesRelatorio,
  obterUrlFotoRelatorio,
  prepararPayloadEquipamentos,
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
  const [toast, setToast] = useState({ message: '', tone: 'cyan' });
  const autosaveTimer = useRef(null);
  const pdfRef = useRef(null);
  const [pdfData, setPdfData] = useState(null);

  const currentIndex = RELATORIO_STEPS.findIndex((step) => step.id === currentStep);

  const goNext = () => {
    if (currentIndex < RELATORIO_STEPS.length - 1) {
      setCurrentStep(RELATORIO_STEPS[currentIndex + 1].id);
    }
  };

  const goPrevious = () => {
    if (currentIndex > 0) {
      setCurrentStep(RELATORIO_STEPS[currentIndex - 1].id);
    }
  };

  const completedSteps = useMemo(() => {
    const done = [];
    if (payload?.dados?.turno) done.push('dados');
    ['bombas', 'rastelos', 'comportas', 'eletrocentro', 'geradores'].forEach((key) => {
      if (payload?.[key]?.items?.length) done.push(key);
    });
    if (payload?.cco?.comunicacao) done.push('cco');
    if (payload?.ocorrencias?.houve) done.push('ocorrencias');
    if (fotos.length || payload?.fotos?.observacao) done.push('fotos');
    return done;
  }, [payload, fotos.length]);

  const currentStepNumber = Math.max(1, currentIndex + 1);
  const progress = RELATORIO_STEPS.length ? Math.round((currentStepNumber / RELATORIO_STEPS.length) * 100) : 0;
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
      }
    } catch (err) {
      setError(err.message || 'Falha ao carregar RDO.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInitial();
  }, [user?.id, user?.perfil]);

  useEffect(() => {
    if (!canEdit || !relatorio?.id || !isEditableReport(relatorio.status)) return;
    clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      saveDraft(false);
    }, 1200);
    return () => clearTimeout(autosaveTimer.current);
  }, [payload, relatorio?.id, relatorio?.status]);

  async function loadEquipamentos(ebapId, basePayload = payload) {
    const rows = await listarEquipamentosRelatorio(ebapId);
    setEquipamentos(rows);
    setPayload(prepararPayloadEquipamentos(basePayload, rows));
  }

  async function handleSelectEbap(ebapId) {
    if (!canEdit) return;
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
    <div className="grid gap-4">
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

      {error && <div className="rounded-2xl border border-red-300/30 bg-red-500/15 p-4 text-sm font-bold text-red-100">{error}</div>}

      <section className="glass-card rounded-3xl p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <label className="field-label">
            EBAP
            <select className="form-control" value={relatorio?.ebap_id || ''} onChange={(event) => handleSelectEbap(event.target.value)} disabled={!canEdit || (relatorio?.status && !isEditableReport(relatorio.status))}>
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
          <RelatorioStepper steps={RELATORIO_STEPS} currentStep={currentStep} completedSteps={completedSteps} onStepClick={setCurrentStep} />
          {renderStep()}
          <WizardNavigation currentIndex={currentIndex} total={RELATORIO_STEPS.length} onPrevious={goPrevious} onNext={goNext} />
        </>
      ) : (
        <div className="glass-card rounded-3xl p-8 text-center text-slate-300">
          Selecione uma EBAP para criar ou carregar o rascunho do RDO.
        </div>
      )}

      <section className="glass-card rounded-3xl p-5">
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

function OperationalSummary({ summary }) {
  return (
    <section className="sticky top-2 z-20 glass-card rounded-3xl p-4 shadow-xl shadow-navy-950/30">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,0.8fr))]">
        <SummaryInfo label="EBAP" value={summary.ebap} />
        <SummaryInfo label="Equipamentos" value={summary.totalEquipamentos} />
        <SummaryInfo label="Preenchidos" value={summary.preenchidos} tone="text-emerald-200" />
        <SummaryInfo label="Pendentes" value={summary.pendentes} tone={summary.pendentes ? 'text-amber-200' : 'text-emerald-200'} />
        <SummaryInfo label="Fotos" value={summary.fotos} tone="text-cyan-200" />
      </div>
    </section>
  );
}

function SummaryInfo({ label, value, tone = 'text-white' }) {
  return (
    <div className="rounded-2xl border border-cyan-300/10 bg-navy-950/50 p-3">
      <small className="block text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</small>
      <strong className={['mt-1 block truncate text-lg font-black', tone].join(' ')}>{value}</strong>
    </div>
  );
}

function WizardNavigation({ currentIndex, total, onPrevious, onNext }) {
  const isFirst = currentIndex <= 0;
  const isLast = currentIndex >= total - 1;
  return (
    <>
      <div className="mt-6 hidden justify-between gap-3 pb-2 sm:flex">
        <button type="button" className="secondary-button" onClick={onPrevious} disabled={isFirst}>
          <ArrowLeft size={17} />
          Anterior
        </button>
        <button type="button" className="primary-button" onClick={onNext} disabled={isLast}>
          Próximo
          <ArrowRight size={17} />
        </button>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cyan-300/15 bg-navy-950/95 p-3 shadow-2xl sm:hidden">
        <div className="grid grid-cols-[0.85fr_1.15fr] gap-2">
          <button type="button" className="secondary-button justify-center" onClick={onPrevious} disabled={isFirst}>
            <ArrowLeft size={17} />
            Anterior
          </button>
          <button type="button" className="primary-button justify-center" onClick={onNext} disabled={isLast}>
            Próximo
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </>
  );
}
