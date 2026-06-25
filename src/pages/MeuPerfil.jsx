import { UserRound } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import { useAuthStore } from '../store/authStore.js';
import { areaOperacionalLabel, equipeTecnicaLabel } from '../services/usuariosService.js';

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('pt-BR');
}

export default function MeuPerfil() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="grid gap-4">
      <PageHeader
        title="Meu Perfil"
        description="Dados de acesso, equipe operacional e área vinculada ao usuário logado."
        actions={<StatusBadge tone={user?.ativo ? 'green' : 'orange'}>{user?.ativo ? 'Ativo' : 'Inativo'}</StatusBadge>}
      />

      <section className="glass-card rounded-3xl p-5">
        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-100">
            <UserRound size={30} />
          </span>
          <div>
            <h2 className="text-2xl font-black text-white">{user?.nome || '-'}</h2>
            <p className="text-sm font-semibold text-slate-300">@{user?.usuario || '-'}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Info label="Perfil" value={user?.perfil} />
          <Info label="Área Operacional" value={areaOperacionalLabel(user?.area_operacional || user?.area_supervisao)} />
          <Info label="Equipe" value={equipeTecnicaLabel(user?.equipe)} />
          <Info label="Setor" value={user?.setor || '-'} />
          <Info label="Status de aprovação" value={user?.status_aprovacao || 'aprovado'} />
          <Info label="Último login" value={formatDate(user?.ultimo_login)} />
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4">
      <small className="block text-xs font-black uppercase tracking-wide text-slate-400">{label}</small>
      <strong className="mt-1 block text-white">{value || '-'}</strong>
    </div>
  );
}
