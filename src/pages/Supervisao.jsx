import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardList, Clock3, RefreshCcw, RotateCcw, ShieldCheck, UserCog, Wrench } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Toast from '../components/ui/Toast.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import SupervisaoFilters from '../components/supervisao/SupervisaoFilters.jsx';
import SupervisaoQueue from '../components/supervisao/SupervisaoQueue.jsx';
import SupervisaoActionModal from '../components/supervisao/SupervisaoActionModal.jsx';
import { useAuthStore } from '../store/authStore.js';
import { useSupervisaoStore } from '../store/supervisaoStore.js';
import { areaLabel } from '../services/supervisaoService.js';

export default function Supervisao() {
  const user = useAuthStore((state) => state.user);
  const { items, count, kpis, contexto, filters, loading, saving, error, setFilters, resetFilters, carregar, executar } = useSupervisaoStore();
  const [modal, setModal] = useState({ action: '', os: null });
  const [toast, setToast] = useState({ message: '', tone: 'cyan' });

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / filters.pageSize)), [count, filters.pageSize]);
  const activeArea = user?.perfil === 'supervisor' ? contexto?.areaAtual || user?.area_operacional || user?.area_supervisao : filters.area;

  useEffect(() => {
    carregar(user);
  }, [filters, user?.id, user?.perfil, user?.area_operacional, user?.area_supervisao]);

  async function handleAction(action, os) {
    if (['confirmar', 'encaminhar', 'validar'].includes(action)) {
      try {
        await executar(action, os.id, {}, user);
        setToast({ message: 'OS movimentada com sucesso.', tone: 'green' });
      } catch {
        // error already stored
      }
      return;
    }
    setModal({ action, os });
  }

  async function handleSubmitModal(payload) {
    try {
      await executar(modal.action, modal.os.id, payload, user);
      setToast({ message: 'Ação registrada com sucesso.', tone: 'green' });
      setModal({ action: '', os: null });
    } catch {
      // error already stored
    }
  }

  function changePage(page) {
    setFilters({ page });
  }

  return (
    <div className="grid gap-4">
      <PageHeader
        title="Tela de Trabalho dos Supervisores"
        description="Fila operacional por área para analisar, programar, encaminhar, validar e reencaminhar Ordens de Serviço."
        leading={<UserCog className="text-cyan-100" size={30} />}
        actions={
          <button className="secondary-button" type="button" onClick={() => carregar(user)} disabled={loading}>
            <RefreshCcw size={17} />
            Atualizar
          </button>
        }
      />

      <section className="glass-card rounded-3xl p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-black text-white">Escopo da supervisão</h3>
            <p className="mt-1 text-sm text-slate-300">
              {contexto?.canSeeAllAreas ? 'Gerência, Diretoria e CCO podem alternar entre todas as áreas.' : 'Supervisor visualiza apenas a própria área cadastrada.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={activeArea ? 'cyan' : 'orange'}>{activeArea ? areaLabel(activeArea) : 'Área não configurada'}</StatusBadge>
            <StatusBadge tone="green">{contexto?.usuario?.nome || user?.nome}</StatusBadge>
          </div>
        </div>
        {user?.perfil === 'supervisor' && !activeArea && (
          <div className="mt-3 rounded-2xl border border-orange-300/30 bg-orange-500/15 p-3 text-sm font-bold text-orange-100">
            Este supervisor ainda não possui `area_supervisao` configurada em Usuários/Supabase.
          </div>
        )}
      </section>

      {error && <div className="rounded-2xl border border-red-300/30 bg-red-500/15 p-4 text-sm font-bold text-red-100">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={ClipboardList} label="Total" value={kpis?.total ?? 0} helper="OS no escopo" />
        <KpiCard icon={Clock3} label="Aguardando" value={kpis?.aguardando ?? 0} helper="Fila inicial" tone="orange" />
        <KpiCard icon={Wrench} label="Programadas" value={kpis?.programadas ?? 0} helper="Com equipe e data" tone="blue" />
        <KpiCard icon={ShieldCheck} label="Validação" value={kpis?.validacao ?? 0} helper="Aguardando supervisor" tone="orange" />
        <KpiCard icon={RotateCcw} label="Devolvidas" value={kpis?.devolvidas ?? 0} helper="Correção pendente" tone="red" />
        <KpiCard icon={CheckCircle2} label="Concluídas" value={kpis?.concluidas ?? 0} helper="Fluxo supervisor encerrado" tone="green" />
        <KpiCard icon={Wrench} label="Em execução" value={kpis?.execucao ?? 0} helper="Técnicos acionados" tone="cyan" />
        <KpiCard icon={ShieldCheck} label="Críticas" value={kpis?.criticas ?? 0} helper="Prioridade crítica" tone="red" />
      </div>

      <SupervisaoFilters filters={filters} contexto={contexto} onChange={setFilters} onReset={resetFilters} />

      <SupervisaoQueue items={items} loading={loading} onAction={handleAction} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-bold text-slate-300">Página {filters.page} de {totalPages} • {count} registro(s)</span>
        <div className="flex gap-2">
          <button className="secondary-button" type="button" disabled={filters.page <= 1} onClick={() => changePage(filters.page - 1)}>Anterior</button>
          <button className="secondary-button" type="button" disabled={filters.page >= totalPages} onClick={() => changePage(filters.page + 1)}>Próxima</button>
        </div>
      </div>

      <SupervisaoActionModal
        action={modal.action}
        os={modal.os}
        contexto={contexto}
        saving={saving}
        onClose={() => setModal({ action: '', os: null })}
        onSubmit={handleSubmitModal}
      />

      <Toast message={toast.message} tone={toast.tone} onClose={() => setToast({ message: '', tone: 'cyan' })} />
    </div>
  );
}
