import { AlertTriangle, BookOpen, Megaphone, ShieldCheck } from 'lucide-react';

const cards = [
  { key: 'total', label: 'Orientações', icon: BookOpen, tone: 'from-cyan-500/20 to-blue-500/15' },
  { key: 'publicados', label: 'Publicadas', icon: ShieldCheck, tone: 'from-green-500/20 to-cyan-500/15' },
  { key: 'comunicados', label: 'Comunicados', icon: Megaphone, tone: 'from-violet-500/20 to-cyan-500/15' },
  { key: 'emergencias', label: 'Emergência', icon: AlertTriangle, tone: 'from-red-500/20 to-orange-500/15' }
];

export default function OrientacoesDashboard({ dashboard }) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.key} className={`rounded-3xl border border-cyan-200/15 bg-gradient-to-br ${card.tone} p-4 shadow-card`}>
            <div className="flex items-center gap-4">
              <span className="grid size-12 place-items-center rounded-2xl bg-navy-950/60 text-cyan-100">
                <Icon size={23} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-300">{card.label}</p>
                <strong className="text-3xl font-black text-white">{dashboard?.[card.key] || 0}</strong>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
