export default function PageHeader({ title, description, actions }) {
  return (
    <section className="glass-card rounded-3xl p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">{title}</h2>
          {description && <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-300">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </section>
  );
}
