import { Bell } from 'lucide-react';

export default function NotificationBadgeButton({ count = 0, onClick }) {
  return (
    <button className="secondary-button relative min-h-10 px-3" type="button" onClick={onClick} aria-label="Abrir notificacoes">
      <Bell size={17} />
      <span className="hidden sm:inline">Alertas</span>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white ring-2 ring-[#0B2D6B]">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
