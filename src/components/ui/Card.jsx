const variants = {
  default: 'border-blue-200/12 bg-[#10224D]/78 shadow-xl shadow-black/15',
  elevated: 'border-blue-200/15 bg-[#10224D]/88 shadow-2xl shadow-black/22',
  subtle: 'border-blue-200/10 bg-white/[0.04]',
  flat: 'border-blue-200/10 bg-transparent'
};

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
  xl: 'p-6'
};

export default function Card({ as: Component = 'section', children, className = '', padding = 'lg', variant = 'default', ...props }) {
  return (
    <Component
      className={[
        'rounded-2xl border transition duration-200',
        variants[variant] || variants.default,
        paddings[padding] || paddings.lg,
        className
      ].join(' ')}
      {...props}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ title, description, action, className = '' }) {
  return (
    <div className={['flex flex-col gap-3 md:flex-row md:items-start md:justify-between', className].join(' ')}>
      <div className="min-w-0">
        <h3 className="ds-card-title text-xl leading-tight text-white">{title}</h3>
        {description && <p className="mt-1 max-w-3xl text-sm font-normal leading-6 text-slate-300">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">{action}</div>}
    </div>
  );
}

export { Card as DSCard };
