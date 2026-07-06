export function Field({ label, hint, error, children, className = '' }) {
  return (
    <label className={['grid gap-2 text-sm font-medium text-slate-100', className].join(' ')}>
      <span>{label}</span>
      {children}
      {hint && !error && <small className="text-xs font-normal text-slate-400">{hint}</small>}
      {error && <small className="text-xs font-medium text-red-200">{error}</small>}
    </label>
  );
}

const controlBase = 'min-h-11 w-full rounded-xl border border-blue-200/18 bg-[#071A45]/72 px-3 text-sm font-normal text-white outline-none transition placeholder:text-slate-400 focus:border-blue-300/70 focus:ring-2 focus:ring-blue-300/20 disabled:cursor-not-allowed disabled:opacity-60';

export function Input({ className = '', invalid = false, ...props }) {
  return <input className={[controlBase, invalid ? 'border-red-300/55 focus:border-red-300 focus:ring-red-300/20' : '', className].join(' ')} {...props} />;
}

export function Select({ children, className = '', invalid = false, ...props }) {
  return (
    <select className={[controlBase, invalid ? 'border-red-300/55 focus:border-red-300 focus:ring-red-300/20' : '', className].join(' ')} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className = '', invalid = false, ...props }) {
  return <textarea className={[controlBase, 'min-h-28 py-3', invalid ? 'border-red-300/55 focus:border-red-300 focus:ring-red-300/20' : '', className].join(' ')} {...props} />;
}

export { Field as DSField, Input as DSInput, Select as DSSelect, Textarea as DSTextarea };
