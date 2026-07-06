import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, RefreshCcw, RotateCcw, XCircle } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import KpiCard from '../components/ui/KpiCard.jsx';
import Modal from '../components/ui/Modal.jsx';
import Toast from '../components/ui/Toast.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import CcoFilters from '../components/cco/CcoFilters.jsx';
import CcoHistoryTimeline from '../components/cco/CcoHistoryTimeline.jsx';
import CcoReportCard from '../components/cco/CcoReportCard.jsx';
import CcoStatusBadge from '../components/cco/CcoStatusBadge.jsx';
import CcoValidationModal from '../components/cco/CcoValidationModal.jsx';
import { useAuthStore } from '../store/authStore.js';
import {
  canValidateCco,
  listarCcoRelatorios,
  listarEbapsCco,
  obterDashboardCco,
  obterRelatorioCco,
  obterUrlFotoCco,
  validarRelatorioCco
} from '../services/ccoService.js';

const initialFilters = {
  page: 1,
  pageSize: 8,
  search: '',
  status: '',
  ebapId: '',
  dataInicio: '',
  dataFim: ''
};

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('pt-BR');
}

export default function CcoRelatoriosDiarios() {
  const user = useAuthStore((state) => state.user);
  const [filters, setFilters] = useState(initialFilters);
  const [ebaps, setEbaps] = useState([]);
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [dashboard, setDashboard] = useState({ pendentes: 0, aprovadosHoje: 0, rejeitadosHoje: 0, correcoesSolicitadas: 0 });
  const [selected, setSelected] = useState(null);
  const [validation, setValidation] = useState({ open: false, action: '', report: null });
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', tone: 'cyan' });

  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));
  const canValidate = canValidateCco(user?.perfil);
  const selectedReport = selected?.report;

  const title = useMemo(() => {
    if (user?.perfil === 'operador') return 'Meus Relatórios Diários';
    return 'CCO - Relatórios Diários';
  }, [user?.perfil]);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [ebapRows, dashboardData, reportRows] = await Promise.all([
        listarEbapsCco(),
        obterDashboardCco({ perfil: user?.perfil, userId: user?.id }),
        listarCcoRelatorios({ ...filters, perfil: user?.perfil, userId: user?.id })
      ]);
      setEbaps(ebapRows);
      setDashboard(dashboardData);
      setReports(reportRows.data);
      setTotal(reportRows.count);
    } catch (err) {
      setError(err.message || 'Falha ao carregar fila CCO.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [filters, user?.id, user?.perfil]);

  async function openReport(report) {
    setDetailLoading(true);
    setError('');
    try {
      const detail = await obterRelatorioCco(report.id);
      setSelected(detail);
    } catch (err) {
      setError(err.message || 'Falha ao abrir relatorio.');
    } finally {
      setDetailLoading(false);
    }
  }

  function openValidation(action, report) {
    setValidation({ open: true, action, report: selected?.report?.id === report.id ? selected.report : report });
  }

  async function submitValidation(payload) {
    setSaving(true);
    setError('');
    try {
      const updated = await validarRelatorioCco(validation.report, validation.action, payload, user);
      setValidation({ open: false, action: '', report: null });
      setToast({ message: 'Validação CCO registrada.', tone: 'green' });
      await loadData();
      if (selected?.report?.id === updated.id) await openReport(updated);
    } catch (err) {
      setError(err.message || 'Falha ao registrar validação.');
    } finally {
      setSaving(false);
    }
  }

  function setPage(page) {
    setFilters((current) => ({ ...current, page }));
  }

  return (
    <div className="grid gap-4">
      <PageHeader
        title={title}
        description="Fila de validação, histórico e rastreabilidade dos Relatórios Diários do Operador."
        actions={
          <button className="secondary-button" type="button" onClick={loadData} disabled={loading}>
            <RefreshCcw size={17} />
            Atualizar
          </button>
        }
      />

      {error && <div className="rounded-2xl border border-red-300/30 bg-red-500/15 p-4 text-sm font-bold text-red-100">{error}</div>}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Clock3} label="Pendentes" value={dashboard.pendentes} helper="Aguardando CCO" tone="orange" />
        <KpiCard icon={CheckCircle2} label="Aprovados hoje" value={dashboard.aprovadosHoje} helper="Validados no dia" tone="green" />
        <KpiCard icon={XCircle} label="Rejeitados hoje" value={dashboard.rejeitadosHoje} helper="Não conformes" tone="red" />
        <KpiCard icon={RotateCcw} label="Correcoes" value={dashboard.correcoesSolicitadas} helper="Retornados ao operador" tone="cyan" />
      </section>

      <CcoFilters filters={filters} ebaps={ebaps} onChange={setFilters} />

      {loading ? (
        <div className="glass-card rounded-3xl p-8 text-center text-slate-300">Carregando relatorios...</div>
      ) : reports.length ? (
        <section className="grid gap-3">
          {reports.map((report) => (
            <CcoReportCard key={report.id} report={report} canValidate={canValidate} onView={openReport} onValidate={openValidation} />
          ))}
        </section>
      ) : (
        <div className="glass-card rounded-3xl p-8 text-center text-slate-300">
          Nenhum relatorio encontrado para os filtros selecionados.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-bold text-slate-300">
          Pagina {filters.page} de {totalPages} | {total} registro(s)
        </span>
        <div className="flex gap-2">
          <button className="secondary-button" type="button" disabled={filters.page <= 1 || loading} onClick={() => setPage(filters.page - 1)}>
            Anterior
          </button>
          <button className="secondary-button" type="button" disabled={filters.page >= totalPages || loading} onClick={() => setPage(filters.page + 1)}>
            Proxima
          </button>
        </div>
      </div>

      <Modal open={Boolean(selected)} title={selectedReport ? `${selectedReport.codigo} - ${selectedReport.ebap?.nome || 'EBAP'}` : 'Relatório'} onClose={() => setSelected(null)}>
        {detailLoading ? (
          <div className="p-6 text-center text-slate-300">Carregando detalhes...</div>
        ) : selectedReport ? (
          <ReportDetail detail={selected} canValidate={canValidate} onValidate={openValidation} />
        ) : null}
      </Modal>

      <CcoValidationModal
        open={validation.open}
        action={validation.action}
        report={validation.report}
        loading={saving}
        onClose={() => setValidation({ open: false, action: '', report: null })}
        onSubmit={submitValidation}
      />

      <Toast message={toast.message} tone={toast.tone} onClose={() => setToast({ message: '', tone: 'cyan' })} />
    </div>
  );
}

function ReportDetail({ detail, canValidate, onValidate }) {
  const { report, secoes = [], itens = [], fotos = [], validacoes = [], auditoria = [] } = detail;
  const payload = report?.payload || {};
  const canDecide = canValidate && report.status === 'pendente_validacao_cco';

  return (
    <div className="grid gap-5">
      <section className="grid gap-3 md:grid-cols-4">
        <Info label="Status" value={<CcoStatusBadge status={report.status} />} />
        <Info label="Operador" value={report.operador?.nome || '-'} />
        <Info label="Operacao" value={formatDateTime(report.data_operacao)} />
        <Info label="Finalizado" value={formatDateTime(report.finalizado_em)} />
      </section>

      {canDecide && (
        <div className="flex flex-wrap gap-2">
          <button className="primary-button" type="button" onClick={() => onValidate('aprovar', report)}>
            <CheckCircle2 size={17} />
            Aprovar
          </button>
          <button className="secondary-button" type="button" onClick={() => onValidate('correcao', report)}>
            <RotateCcw size={17} />
            Solicitar correcao
          </button>
          <button className="danger-button" type="button" onClick={() => onValidate('rejeitar', report)}>
            <XCircle size={17} />
            Rejeitar
          </button>
        </div>
      )}

      <section className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4">
        <h3 className="mb-3 text-lg font-black text-white">Observacoes do operador</h3>
        <p className="text-sm leading-6 text-slate-300">{report.ocorrencias || payload?.ocorrencias?.descricao || 'Sem ocorrencias descritas.'}</p>
        <p className="mt-3 text-sm leading-6 text-slate-300">{report.conclusao_operador || payload?.ocorrencias?.conclusao || 'Sem conclusao informada.'}</p>
      </section>

      <section className="grid gap-3">
        <h3 className="text-lg font-black text-white">Checklist</h3>
        <div className="grid gap-3">
          {itens.length ? (
            itens.map((item) => (
              <div key={item.id} className="grid gap-2 rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <strong className="text-white">{item.equipamento?.tag ? `${item.equipamento.tag} - ${item.descricao}` : item.descricao}</strong>
                  <p className="text-sm text-slate-300">{item.tipo_item} | {item.observacao || 'Sem observacao'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge tone={operationalStatusTone(item.status)} size="md">{operationalStatusLabel(item.status)}</StatusBadge>
                  {item.dados?.comparacao_anterior && <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-xs font-black text-amber-100"><AlertTriangle size={13} /> Status alterado desde o último RDO</span>}
                  {item.solicitar_os && <span className="inline-flex items-center gap-1 rounded-full border border-orange-300/30 bg-orange-400/10 px-3 py-1 text-xs font-black text-orange-100"><AlertTriangle size={13} /> OS solicitada</span>}
                </div>
              </div>
            ))
          ) : (
            secoes.map((secao) => (
              <div key={secao.id} className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4">
                <strong className="text-white">{secao.titulo}</strong>
                <p className="mt-1 text-sm text-slate-300">{secao.status}</p>
              </div>
            ))
          )}
        </div>
      </section>

      <PhotoGrid fotos={fotos} />

      <section className="grid gap-3">
        <h3 className="text-lg font-black text-white">Historico</h3>
        <CcoHistoryTimeline validacoes={validacoes} auditoria={auditoria} />
      </section>
    </div>
  );
}

function PhotoGrid({ fotos = [] }) {
  const [urls, setUrls] = useState({});

  useEffect(() => {
    let active = true;
    async function loadUrls() {
      const entries = await Promise.all(
        fotos.map(async (foto) => {
          try {
            return [foto.id, await obterUrlFotoCco(foto)];
          } catch {
            return [foto.id, ''];
          }
        })
      );
      if (active) setUrls(Object.fromEntries(entries));
    }
    loadUrls();
    return () => {
      active = false;
    };
  }, [fotos]);

  return (
    <section className="grid gap-3">
      <h3 className="text-lg font-black text-white">Fotos</h3>
      {fotos.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {fotos.map((foto) => (
            <figure key={foto.id} className="overflow-hidden rounded-2xl border border-cyan-300/15 bg-navy-950/55">
              {urls[foto.id] ? (
                <img className="h-44 w-full object-cover" src={urls[foto.id]} alt={foto.legenda || foto.nome_original || 'Foto do relatorio'} />
              ) : (
                <div className="grid h-44 place-items-center text-sm text-slate-300">Foto indisponível</div>
              )}
              <figcaption className="p-3 text-sm text-slate-300">{foto.legenda || foto.nome_original || 'Foto do relatorio'}</figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4 text-sm text-slate-300">
          Nenhuma foto anexada.
        </div>
      )}
    </section>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4">
      <small className="block text-xs font-black uppercase tracking-wide text-slate-400">{label}</small>
      <div className="mt-2 text-sm font-black text-white">{value}</div>
    </div>
  );
}


function operationalStatusLabel(status) {
  const labels = { operando: 'Operando', atencao: 'Atenção', parado: 'Parado', em_manutencao: 'Em Manutenção', manutencao: 'Em Manutenção', falha: 'Parado', normal: 'Operando' };
  return labels[status] || status || '-';
}

function operationalStatusTone(status) {
  const tones = { operando: 'green', atencao: 'yellow', parado: 'red', em_manutencao: 'blue', manutencao: 'blue', falha: 'red', normal: 'green' };
  return tones[status] || 'cyan';
}
