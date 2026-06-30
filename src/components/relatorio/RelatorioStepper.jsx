import { Check } from 'lucide-react';

export default function RelatorioStepper({ steps, currentStep, completedSteps = [], onStepClick, canAccessStep = () => true }) {
  const currentIndex = Math.max(0, steps.findIndex((step) => step.id === currentStep));
  const percent = steps.length ? Math.round((completedSteps.length / steps.length) * 100) : 0;

  return (
    <section className="glass-card rounded-3xl p-4">
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <h3 className="text-lg font-black text-white">Progresso do RDO</h3>
          <p className="text-sm font-bold text-slate-300">Etapa {currentIndex + 1} de {steps.length} | {percent}% concluído</p>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full border border-cyan-300/20 bg-navy-950 md:w-72">
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 transition-all duration-300" style={{ width: percent + '%' }} />
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((step) => {
          const active = step.id === currentStep;
          const done = completedSteps.includes(step.id);
          const locked = !canAccessStep(step.id);
          return (
            <button
              key={step.id}
              type="button"
              disabled={locked}
              className={[
                'grid min-h-16 grid-cols-[34px_minmax(0,1fr)] items-center gap-2 rounded-2xl border p-3 text-left transition',
                active
                  ? 'border-cyan-300/70 bg-cyan-400/15'
                  : locked
                    ? 'border-cyan-300/10 bg-navy-950/30 opacity-60'
                    : done
                      ? 'border-emerald-300/25 bg-emerald-400/10'
                      : 'border-cyan-300/15 bg-navy-950/45 hover:border-cyan-300/40'
              ].join(' ')}
              onClick={() => onStepClick(step.id)}
            >
              <span className={[
                'grid h-8 w-8 place-items-center rounded-xl text-xs font-black',
                active ? 'bg-cyan-300 text-navy-950' : done ? 'bg-emerald-300 text-navy-950' : 'bg-navy-950/80 text-slate-300'
              ].join(' ')}>
                {done ? <Check size={16} /> : active ? '●' : '○'}
              </span>
              <span className="min-w-0">
                <strong className="block truncate text-sm font-black text-white">{step.title}</strong>
                <small className="block text-[11px] font-bold text-slate-400">{locked ? 'Bloqueado' : done ? 'Concluído' : active ? 'Atual' : 'Pendente'}</small>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
