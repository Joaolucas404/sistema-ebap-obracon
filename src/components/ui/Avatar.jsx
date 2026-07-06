function getInitials(name = '') {
  return String(name || 'U')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

const sizes = {
  sm: 'h-9 w-9 text-xs rounded-xl',
  md: 'h-11 w-11 text-sm rounded-2xl',
  lg: 'h-16 w-16 text-lg rounded-2xl',
  xl: 'h-24 w-24 text-3xl rounded-[26px]'
};

export default function Avatar({ alt = 'Usuário', className = '', name, size = 'md', src }) {
  return (
    <span
      className={[
        'grid shrink-0 place-items-center overflow-hidden border border-blue-200/18 bg-blue-500/16 font-black text-white shadow-inner shadow-white/5',
        sizes[size] || sizes.md,
        className
      ].join(' ')}
    >
      {src ? <img className="h-full w-full object-cover" src={src} alt={alt} /> : getInitials(name || alt)}
    </span>
  );
}

export { Avatar as DSAvatar };
