export default function EmptyState({ title = 'Nenhum registro encontrado', description }) {
  return (
    <div className="glass-card rounded-2xl p-8 text-center">
      <h3 className="text-lg font-black text-white">{title}</h3>
      {description && <p className="mt-2 text-sm text-slate-300">{description}</p>}
    </div>
  );
}
