import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'border-blue-300/20 bg-blue-600 text-white shadow-lg shadow-blue-950/25 hover:bg-blue-500',
  secondary: 'border-blue-200/18 bg-white/10 text-slate-100 hover:border-blue-200/35 hover:bg-white/14',
  outline: 'border-blue-200/25 bg-transparent text-blue-100 hover:bg-blue-500/12',
  ghost: 'border-transparent bg-transparent text-slate-200 hover:bg-white/8',
  danger: 'border-red-300/30 bg-red-500/15 text-red-100 hover:bg-red-500/24'
};

const sizes = {
  sm: 'min-h-9 px-3 text-[13px]',
  md: 'min-h-11 px-4 text-[15px]',
  lg: 'min-h-12 px-5 text-[15px]'
};

export default function Button({
  as: Component = 'button',
  children,
  className = '',
  disabled,
  icon: Icon,
  loading = false,
  size = 'md',
  type = 'button',
  variant = 'secondary',
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <Component
      className={[
        'ds-button inline-flex items-center justify-center gap-2 rounded-xl border transition duration-200',
        'focus:outline-none focus:ring-2 focus:ring-blue-300/35 focus:ring-offset-0',
        'disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0',
        !isDisabled ? 'hover:-translate-y-0.5 active:translate-y-0' : '',
        variants[variant] || variants.secondary,
        sizes[size] || sizes.md,
        className
      ].join(' ')}
      disabled={isDisabled}
      type={Component === 'button' ? type : undefined}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" size={18} /> : Icon ? <Icon size={18} /> : null}
      {children}
    </Component>
  );
}

export { Button as DSButton };
