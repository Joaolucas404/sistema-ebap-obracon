import { CheckCircle2, Eye, PauseCircle, PlayCircle, RotateCcw } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge.jsx';
import { areaLabel, formatDuration, prioridadeLabel, statusLabel } from '../../services/osDiariaService.js';
import { prioridadeTone, statusTone } from '../../services/osService.js';

function time(value) {
  return value ? String(value).slice(0, 5) : '-';
}

export default function OsDiariaCard({ os, onDetail, onAction }) {
  const exec = os.payload?.execucao_diaria || {};
  const seconds = Number(exec.tempo_total_segundos || 0);

  return (
    <article className="glass-card rounded-3xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-black text-white">{os.numero}</h3>
            <StatusBadge tone={statusTone(os.status)}>{statusLabel(os.status)}</StatusBadge>
            <StatusBadge tone={prioridadeTone(os.prioridade)}>{prioridadeLabel(os.prioridade)}</StatusBadge>
          </div>
          <p className="mt-1 font-bold text-slate-200">{os.titulo}</p>
          <p className="mt-1 text-sm text-slate-300">{os.ebap?.nome || '-'} - {areaLabel(os.area)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="secondary-button min-h-10 px-3" type="button" onClick={() => onDetail(os)}>
            <Eye size={16} />
            Detalhe
          </button>
          {['programada', 'encaminhada_tecnicos'].includes(os.status) && (
            <button className="primary-button min-h-10 px-3" type="button" onClick={() => onAction(os, 'iniciar')}>
              <PlayCircle size={16} />
              Iniciar
            </button>
          )}
          {os.status === 'em_execucao' && (
            <>
              <button className="secondary-button min-h-10 px-3" type="button" onClick={() => onAction(os, 'pausar')}>
                <PauseCircle size={16} />
                Pausar
              </button>
              <button className="primary-button min-h-10 px-3" type="button" onClick={() => onAction(os, 'concluir')}>
                <CheckCircle2 size={16} />
                Concluir
              </button>
            </>
          )}
          {os.status === 'pausada' && (
            <>
              <button className="primary-button min-h-10 px-3" type="button" onClick={() => onAction(os, 'retomar')}>
                <RotateCcw size={16} />
                Retomar
              </button>
              <button className="secondary-button min-h-10 px-3" type="button" onClick={() => onAction(os, 'concluir')}>
                <CheckCircle2 size={16} />
                Concluir
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-5">
        <Info label="Horario" value={time(os.hora_programada)} />
        <Info label="Turno" value={os.turno || '-'} />
        <Info label="Supervisor" value={os.responsavel?.nome || '-'} />
        <Info label="Tempo total" value={formatDuration(seconds)} />
        <Info label="Equipamento" value={os.payload?.equipamento_falha || os.equipamento?.nome || '-'} />
      </div>
    </article>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-cyan-300/10 bg-navy-950/35 p-3">
      <small className="font-black uppercase text-slate-400">{label}</small>
      <strong className="block truncate text-white">{value}</strong>
    </div>
  );
}
