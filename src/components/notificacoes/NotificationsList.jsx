import { BellRing } from 'lucide-react';
import NotificationItem from './NotificationItem.jsx';

export default function NotificationsList({ notifications, loading, onRead, onOpen }) {
  if (loading) {
    return <div className="glass-card rounded-3xl p-8 text-center text-slate-300">Carregando notificacoes...</div>;
  }

  if (!notifications.length) {
    return (
      <div className="glass-card rounded-3xl p-8 text-center">
        <BellRing className="mx-auto text-cyan-200" size={38} />
        <h3 className="mt-3 text-xl font-black text-white">Nenhuma notificacao encontrada</h3>
        <p className="text-sm text-slate-300">Ajuste os filtros ou aguarde novos alertas operacionais.</p>
      </div>
    );
  }

  return (
    <section className="grid gap-3">
      {notifications.map((notificacao) => (
        <NotificationItem key={notificacao.id} notificacao={notificacao} onRead={onRead} onOpen={onOpen} />
      ))}
    </section>
  );
}
