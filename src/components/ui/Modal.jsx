import { X } from 'lucide-react';

export default function Modal({ open, title, children, footer, onClose, fullMobile = false }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#0A1633]/78 p-3 backdrop-blur-sm">
      <div className={`glass-card w-full overflow-hidden ${fullMobile ? 'h-[100dvh] max-h-[100dvh] rounded-none sm:h-auto sm:max-h-[94vh] sm:max-w-3xl sm:rounded-2xl' : 'max-h-[94vh] max-w-3xl rounded-2xl'}`}>
        <div className="flex items-center justify-between border-b border-blue-300/15 px-4 py-3">
          <h3 className="text-base font-black text-white">{title}</h3>
          <button type="button" className="secondary-button min-h-9 px-3" onClick={onClose} aria-label="Fechar modal">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[76vh] overflow-auto p-4">{children}</div>
        {footer && <div className="border-t border-blue-300/15 px-4 py-3">{footer}</div>}
      </div>
    </div>
  );
}
