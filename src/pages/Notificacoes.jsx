import { useEffect, useMemo, useState } from 'react';
import { BellRing, CheckCheck, RefreshCcw } from 'lucide-react';
import NotificationsFilters from '../components/notificacoes/NotificationsFilters.jsx';
import NotificationsList from '../components/notificacoes/NotificationsList.jsx';
import Modal from '../components/ui/Modal.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Toast from '../components/ui/Toast.jsx';
import { useAuthStore } from '../store/authStore.js';
import { useNotificacoesStore } from '../store/notificacoesStore.js';

function formatDate(value) {
  return value ? new Date(value).toLocaleString('pt-BR') : '-';
}

export default function Notificacoes() {
  const user = useAuthStore((state) => state.user);
  const {
    notificacoes,
    count,
    unreadCount,
    filters,
    loading,
    saving,
    error,
    setFilters,
    resetFilters,
    carregar,
    marcarLida,
    marcarTodasLidas,
    iniciarRealtime,
    pararRealtime
  } = useNotificacoesStore();

  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState({ message: '', tone: 'cyan' });

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / filters.pageSize)), [count, filters.pageSize]);

  useEffect(() => {
    carregar(user);
  }, [filters, user, carregar]);

  useEffect(() => {
    iniciarRealtime(user);
    return () => pararRealtime();
  }, [user, iniciarRealtime, pararRealtime]);

  async function handleRead(id) {
    try {
      await marcarLida(id, user);
      setToast({ message: 'Notificacao marcada como lida.', tone: 'green' });
    } catch (err) {
      setToast({ message: err.message || 'Nao foi possivel marcar como lida.', tone: 'red' });
    }
  }

  async function handleReadAll() {
    try {
      const updated = await marcarTodasLidas(user);
      setToast({ message: `${updated} notificacao(oes) marcada(s) como lida(s).`, tone: 'green' });
    } catch (err) {
      setToast({ message: err.message || 'Nao foi possivel marcar todas como lidas.', tone: 'red' });
    }
  }

  function changePage(page) {
    setFilters({ page });
  }

  return (
    <div className="grid gap-4">
      <PageHeader
        title="Central de Alertas"
        description="Notificacoes operacionais em tempo real para OS, RDO, CCO, SST, almoxarifado, compras e manutencao."
        leading={<span className="grid size-12 place-items-center rounded-2xl bg-navy-950/60 text-cyan-100"><BellRing size={24} /></span>}
        actions={
          <>
            <button className="secondary-button" type="button" onClick={() => carregar(user)} disabled={loading}>
              <RefreshCcw size={17} />
              Atualizar
            </button>
            <button className="primary-button" type="button" onClick={handleReadAll} disabled={saving || unreadCount === 0}>
              <CheckCheck size={18} />
              Ler todas
            </button>
          </>
        }
      />

      {error && <div className="rounded-2xl border border-red-300/30 bg-red-500/15 p-4 text-sm font-bold text-red-100">{error}</div>}

      <section className="grid gap-4 sm:grid-cols-3">
        <InfoCard label="Nao lidas" value={unreadCount} />
        <InfoCard label="Total filtrado" value={count} />
        <InfoCard label="Realtime" value="Ativo" />
      </section>

      <NotificationsFilters filters={filters} onChange={setFilters} onReset={resetFilters} />
      <NotificationsList notifications={notificacoes} loading={loading} onRead={handleRead} onOpen={setSelected} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-bold text-slate-300">Pagina {filters.page} de {totalPages} - {count} notificacao(oes)</span>
        <div className="flex gap-2">
          <button className="secondary-button" type="button" disabled={filters.page <= 1} onClick={() => changePage(filters.page - 1)}>Anterior</button>
          <button className="secondary-button" type="button" disabled={filters.page >= totalPages} onClick={() => changePage(filters.page + 1)}>Proxima</button>
        </div>
      </div>

      <Modal open={Boolean(selected)} title="Detalhes da notificacao" onClose={() => setSelected(null)}>
        {selected && (
          <div className="grid gap-4">
            <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-4">
              <h3 className="text-xl font-black text-white">{selected.titulo}</h3>
              <p className="mt-2 text-slate-300">{selected.mensagem}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Info label="Modulo" value={selected.modulo || 'geral'} />
              <Info label="Prioridade" value={selected.prioridade || 'normal'} />
              <Info label="Tipo" value={selected.tipo || 'info'} />
              <Info label="Criada em" value={formatDate(selected.created_at)} />
              <Info label="Lida em" value={formatDate(selected.lida_em)} />
              <Info label="Entidade" value={selected.entidade_tipo || '-'} />
            </div>
            {!selected.lida_em && (
              <button className="primary-button justify-center" type="button" onClick={() => handleRead(selected.id)}>
                <CheckCheck size={18} />
                Marcar como lida
              </button>
            )}
          </div>
        )}
      </Modal>

      <Toast message={toast.message} tone={toast.tone} onClose={() => setToast({ message: '', tone: 'cyan' })} />
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <small className="font-black uppercase tracking-wide text-slate-400">{label}</small>
      <strong className="mt-1 block text-3xl font-black text-white">{value}</strong>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-cyan-300/10 bg-navy-950/35 p-3">
      <small className="font-black uppercase text-slate-400">{label}</small>
      <strong className="block text-white">{value}</strong>
    </div>
  );
}
