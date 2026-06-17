import { X } from 'lucide-react';

export default function Modal({ open, title, children, footer, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="glass-card max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-3xl">
        <div className="flex items-center justify-between border-b border-cyan-300/15 px-5 py-4">
          <h3 className="text-lg font-black text-white">{title}</h3>
          <button type="button" className="secondary-button min-h-10 px-3" onClick={onClose} aria-label="Fechar modal">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-auto p-5">{children}</div>
        {footer && <div className="border-t border-cyan-300/15 px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}
