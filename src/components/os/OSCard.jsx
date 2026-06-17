import { CalendarClock, MapPin, UserRound, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from '../ui/StatusBadge.jsx';
import { prioridadeLabel, prioridadeTone, statusLabel, statusTone } from '../../services/osService.js';

function formatDate(value) {
  if (!value) return 'Sem data';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Sem data' : date.toLocaleDateString('pt-BR');
}

export default function OSCard({ os }) {
  return (
    <article className="glass-card rounded-3xl p-4 transition hover:border-cyan-300/40">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-lg font-black text-white">{os.numero}</strong>
            <StatusBadge tone={statusTone(os.status)}>{statusLabel(os.status)}</StatusBadge>
            <StatusBadge tone={prioridadeTone(os.prioridade)}>{prioridadeLabel(os.prioridade)}</StatusBadge>
          </div>
          <h3 className="mt-2 text-xl font-black text-white">{os.titulo}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-300">{os.descricao}</p>
        </div>
        <Link className="primary-button shrink-0" to={`/os/${os.id}`}>
          Abrir detalhes
        </Link>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-4">
        <span className="flex items-center gap-2">
          <MapPin size={16} className="text-cyan-200" />
          {os.ebap?.nome || 'EBAP não informada'}
        </span>
        <span className="flex items-center gap-2">
          <Wrench size={16} className="text-cyan-200" />
          {os.equipamento?.nome || 'Equipamento não informado'}
        </span>
        <span className="flex items-center gap-2">
          <UserRound size={16} className="text-cyan-200" />
          {os.responsavel?.nome || 'Sem responsável'}
        </span>
        <span className="flex items-center gap-2">
          <CalendarClock size={16} className="text-cyan-200" />
          {formatDate(os.data_programada || os.created_at)}
        </span>
      </div>
    </article>
  );
}
