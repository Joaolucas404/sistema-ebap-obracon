import { CheckCircle2, Clock3, FileText } from 'lucide-react';
import CcoStatusBadge from './CcoStatusBadge.jsx';

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('pt-BR');
}

function validationLabel(status) {
  const labels = {
    validado: 'Validado',
    nao_validado: 'Rejeitado',
    aguardando_correcao: 'Correcao solicitada',
    devolvido: 'Devolvido',
    pendente: 'Pendente',
    validado_com_restricao: 'Validado com restricao'
  };
  return labels[status] || status || '-';
}

export default function CcoHistoryTimeline({ validacoes = [], auditoria = [] }) {
  const events = [
    ...validacoes.map((item) => ({
      id: `validacao-${item.id}`,
      type: 'validacao',
      title: validationLabel(item.status),
      date: item.validado_em || item.created_at,
      user: item.operador_cco?.nome,
      status: item.status,
      detail: item.motivo_devolucao || item.observacoes || item.protocolo
    })),
    ...auditoria.map((item) => ({
      id: `auditoria-${item.id}`,
      type: 'auditoria',
      title: `Auditoria: ${item.acao}`,
      date: item.created_at,
      user: item.usuario?.nome,
      detail: `${item.dados_anteriores?.status || '-'} -> ${item.dados_novos?.status || '-'}`
    }))
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  if (!events.length) {
    return (
      <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4 text-sm text-slate-300">
        Nenhum evento de validacao registrado.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {events.map((event) => (
        <div key={event.id} className="grid grid-cols-[auto_1fr] gap-3 rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-100">
            {event.type === 'validacao' ? <CheckCircle2 size={18} /> : <FileText size={18} />}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <strong className="text-white">{event.title}</strong>
              {event.type === 'validacao' && <CcoStatusBadge status={event.status === 'validado' ? 'validado_cco' : event.status === 'nao_validado' ? 'rejeitado_cco' : 'correcao_solicitada'} />}
            </div>
            <p className="mt-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
              <Clock3 size={14} />
              {formatDateTime(event.date)} {event.user ? `| ${event.user}` : ''}
            </p>
            {event.detail && <p className="mt-2 text-sm leading-6 text-slate-300">{event.detail}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
