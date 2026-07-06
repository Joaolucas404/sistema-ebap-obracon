export default function Tabs({ items = [], value, onChange, className = '' }) {
  return (
    <div className={['inline-flex flex-wrap gap-1 rounded-2xl border border-blue-200/12 bg-white/[0.04] p-1', className].join(' ')}>
      {items.map((item) => {
        const active = item.value === value;
        const Icon = item.icon;
        return (
          <button
            key={item.value}
            className={[
              'inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-black transition',
              active ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/20' : 'text-slate-300 hover:bg-white/8 hover:text-white'
            ].join(' ')}
            type="button"
            onClick={() => onChange?.(item.value)}
          >
            {Icon && <Icon size={17} />}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export { Tabs as DSTabs };
