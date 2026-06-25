import { Check } from 'lucide-react';

export default function RelatorioStepper({ steps, currentStep, completedSteps = [], onStepClick }) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);
  const percent = steps.length > 1 ? Math.round((currentIndex / (steps.length - 1)) * 100) : 0;

  return (
    <section className="glass-card rounded-3xl p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-white">Progresso do RDO</h3>
          <p className="text-sm text-slate-300">{percent}% concluído</p>
        </div>
        <div className="h-3 w-36 overflow-hidden rounded-full border border-cyan-300/20 bg-navy-950 md:w-64">
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600" style={{ width: `${percent}%` }} />
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {steps.map((step, index) => {
          const active = step.id === currentStep;
          const done = completedSteps.includes(step.id);
          return (
            <button
              key={step.id}
              type="button"
              className={[
                'grid min-h-14 grid-cols-[30px_minmax(0,1fr)] items-center gap-2 rounded-2xl border p-2 text-left transition',
                active ? 'border-cyan-300/70 bg-cyan-400/15' : 'border-cyan-300/15 bg-navy-950/45 hover:border-cyan-300/40'
              ].join(' ')}
              onClick={() => onStepClick(step.id)}
            >
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-navy-950/80 text-xs font-black text-cyan-100">
                {done ? <Check size={16} /> : index + 1}
              </span>
              <span className="truncate text-sm font-black text-white">{step.title}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
