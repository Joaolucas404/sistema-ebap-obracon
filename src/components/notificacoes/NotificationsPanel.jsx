import { CheckCheck, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationItem from './NotificationItem.jsx';

export default function NotificationsPanel({ open, notifications, unreadCount, saving, onClose, onRead, onReadAll }) {
  const navigate = useNavigate();

  if (!open) return null;

  function goToCenter() {
    onClose();
    navigate('/notificacoes');
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="absolute right-0 top-0 h-full w-full max-w-md overflow-hidden border-l border-cyan-300/20 bg-[#0B2D6B] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-cyan-300/15 p-4">
          <div>
            <h2 className="text-xl font-black text-white">Alertas</h2>
            <p className="text-sm text-slate-300">{unreadCount} nao lida(s)</p>
          </div>
          <button className="secondary-button min-h-10 px-3" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-2 border-b border-cyan-300/15 p-4">
          <button className="secondary-button flex-1" type="button" onClick={onReadAll} disabled={saving || unreadCount === 0}>
            <CheckCheck size={17} />
            Ler todas
          </button>
          <button className="primary-button flex-1" type="button" onClick={goToCenter}>
            Central
          </button>
        </div>

        <div className="grid max-h-[calc(100vh-150px)] gap-3 overflow-auto p-4">
          {notifications.length ? (
            notifications.map((notificacao) => (
              <NotificationItem key={notificacao.id} notificacao={notificacao} compact onRead={onRead} onOpen={goToCenter} />
            ))
          ) : (
            <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-6 text-center text-slate-300">
              Nenhuma notificacao encontrada.
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
