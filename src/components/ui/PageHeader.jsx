export default function PageHeader({ title, description, actions, leading }) {
  return (
    <section className="page-surface overflow-hidden">
      <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          {leading && <div className="shrink-0 rounded-2xl bg-white/5 p-1 ring-1 ring-white/10">{leading}</div>}
          <div className="min-w-0">
            <h2 className="text-2xl font-black leading-tight text-white md:text-3xl">{title}</h2>
            {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap gap-2 md:justify-end">{actions}</div>}
      </div>
    </section>
  );
}
