import { Archive, ClipboardList, MapPin, ShieldCheck } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import { useAuthStore } from '../store/authStore.js';

const ebaps = [
  { nome: 'EBAP Marinho', status: 'Atenção', disponibilidade: 86 },
  { nome: 'EBAP Cobilândia', status: 'Normal', disponibilidade: 100 },
  { nome: 'EBAP Aribiri', status: 'Crítica', disponibilidade: 42 },
  { nome: 'EBAP Canal da Costa', status: 'Atenção', disponibilidade: 74 }
];

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="grid gap-4">
      <PageHeader
        title="Dashboard Geral"
        description=""
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={MapPin} label="EBAPs monitoradas" value="11" helper="Cadastro base preparado" />
        <KpiCard icon={ClipboardList} label="OS em aberto" value="0" helper="Módulo futuro" tone="orange" />
        <KpiCard icon={ShieldCheck} label="Perfil ativo" value={user?.perfil || '-'} helper={user?.nome} tone="green" />
        <KpiCard icon={Archive} label="Acervo" value="Pronto" helper="Rotas criadas" tone="blue" />
      </div>

      <section className="glass-card rounded-3xl p-5">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-xl font-black text-white">Situação operacional</h3>
            <p className="text-sm text-slate-300">Amostra visual inspirada no HTML original.</p>
          </div>
          <StatusBadge>Base React ativa</StatusBadge>
        </div>
        <div className="grid gap-3">
          {ebaps.map((ebap) => (
            <div key={ebap.nome} className="grid gap-3 rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4 md:grid-cols-[1fr_160px_110px] md:items-center">
              <div>
                <strong className="text-white">{ebap.nome}</strong>
                <p className="text-sm text-slate-300">Disponibilidade operacional estimada.</p>
              </div>
              <div className="h-3 overflow-hidden rounded-full border border-cyan-300/20 bg-navy-950">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600" style={{ width: `${ebap.disponibilidade}%` }} />
              </div>
              <StatusBadge tone={ebap.status === 'Normal' ? 'green' : ebap.status === 'Crítica' ? 'red' : 'orange'}>{ebap.status}</StatusBadge>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
