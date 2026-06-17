import PageHeader from '../components/ui/PageHeader.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import { useAuthStore } from '../store/authStore.js';

export default function Config() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="grid gap-4">
      <PageHeader title="Configurações" description="Área inicial para parâmetros do sistema, permissões e cadastros base." />

      <section className="glass-card rounded-3xl p-5">
        <h3 className="text-xl font-black text-white">Sessão atual</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4">
            <small className="font-black uppercase tracking-wide text-slate-400">Nome</small>
            <strong className="mt-1 block text-white">{user?.nome}</strong>
          </div>
          <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4">
            <small className="font-black uppercase tracking-wide text-slate-400">Perfil</small>
            <div className="mt-2">
              <StatusBadge>{user?.perfil}</StatusBadge>
            </div>
          </div>
          <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4">
            <small className="font-black uppercase tracking-wide text-slate-400">Setor</small>
            <strong className="mt-1 block text-white">{user?.setor || 'Não informado'}</strong>
          </div>
          <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4">
            <small className="font-black uppercase tracking-wide text-slate-400">Autenticação</small>
            <strong className="mt-1 block text-white">Usuário e senha via tabela usuarios</strong>
          </div>
        </div>
      </section>
    </div>
  );
}
