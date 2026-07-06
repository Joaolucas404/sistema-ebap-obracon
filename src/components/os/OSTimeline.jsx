import { Activity, CircleDot, Clock3, UserRound } from 'lucide-react';
import { statusLabel } from '../../services/osService.js';

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('pt-BR');
}

function eventTitle(item) {
  if (item.descricao) return item.descricao;
  if (item.status_novo) return `Status alterado para ${statusLabel(item.status_novo)}`;
  if (item.acao) return actionLabel(item.acao);
  return 'Movimentação registrada';
}

function actionLabel(action) {
  const labels = {
    create: 'OS criada',
    review: 'Análise registrada',
    assign: 'Encaminhada aos técnicos',
    start: 'Execução iniciada',
    finish: 'Serviço concluído',
    validate: 'Validação registrada',
    send: 'Enviada para aprovação',
    comentario: 'Comentário',
    anexo: 'Evidência anexada',
    return: 'Correção solicitada',
    reject: 'Rejeição registrada',
    update: 'Atualização registrada'
  };
  return labels[String(action || '').toLowerCase()] || action || 'Movimentação';
}

function latestEvent(events) {
  return events[0] || null;
}

export default function OSTimeline({ historico = [], statusAtual = '', os = null }) {
  const events = [...historico].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  const latest = latestEvent(events);
  const responsavelAtual = os?.responsavel?.nome || os?.tecnico?.nome || latest?.usuario?.nome || 'Sistema';
  const updatedAt = latest?.created_at || os?.updated_at || os?.created_at;

  return (
    <div className="grid gap-4">
      <section className="rounded-2xl border border-blue-200/15 bg-[#0A1633]/70 p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryItem icon={Activity} label="Status atual" value={statusLabel(statusAtual)} />
          <SummaryItem icon={UserRound} label="Responsável atual" value={responsavelAtual} />
          <SummaryItem icon={Clock3} label="Última atualização" value={formatDate(updatedAt)} />
        </div>
      </section>

      <section className="rounded-2xl border border-blue-200/15 bg-[#0A1633]/55 p-4">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-blue-100">Timeline operacional</h4>
        {events.length ? (
          <div className="mt-4 grid gap-0">
            {events.map((item, index) => (
              <TimelineEvent key={item.id || `${item.acao}-${item.created_at}-${index}`} item={item} isLast={index === events.length - 1} />
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-300">Ainda não há movimentações registradas.</p>
        )}
      </section>

      {events.length > 0 && (
        <section className="rounded-2xl border border-blue-200/15 bg-[#0A1633]/55 p-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-blue-100">Histórico técnico</h4>
          <div className="mt-4 divide-y divide-blue-200/10">
            {events.map((item, index) => (
              <HistoryRow key={item.id || `history-${item.created_at}-${index}`} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SummaryItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-blue-200/15 bg-blue-500/15 text-blue-100">
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <strong className="mt-1 block truncate text-base font-semibold text-white">{value || '-'}</strong>
      </div>
    </div>
  );
}

function TimelineEvent({ item, isLast }) {
  return (
    <article className="grid grid-cols-[24px_1fr] gap-3">
      <div className="grid justify-items-center">
        <span className="mt-1 grid h-5 w-5 place-items-center rounded-full border border-blue-200/30 bg-blue-500/20 text-blue-100">
          <CircleDot size={12} />
        </span>
        {!isLast && <span className="mt-1 h-full w-px bg-blue-200/15" />}
      </div>
      <div className="pb-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <strong className="text-sm font-semibold text-white">{eventTitle(item)}</strong>
          <span className="text-xs text-slate-400">{formatDate(item.created_at)}</span>
        </div>
        {(item.status_anterior || item.status_novo) && (
          <p className="mt-1 text-xs font-medium text-blue-100">
            {statusLabel(item.status_anterior)} para {statusLabel(item.status_novo)}
          </p>
        )}
        <p className="mt-1 text-xs text-slate-400">{item.usuario?.nome || 'Sistema'}</p>
      </div>
    </article>
  );
}

function HistoryRow({ item }) {
  const motivo = item.metadata?.motivo;
  return (
    <article className="grid gap-1 py-3 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <strong className="text-sm font-semibold text-white">{item.usuario?.nome || 'Sistema'}</strong>
        <span className="text-xs text-slate-400">{formatDate(item.created_at)}</span>
      </div>
      <p className="text-sm text-slate-300">{eventTitle(item)}</p>
      {motivo && <p className="text-xs font-medium text-red-100">Motivo: {motivo}</p>}
    </article>
  );
}
