import { FileText, MessageSquare, Paperclip } from 'lucide-react';
import CcoOsStatusBadge from './CcoOsStatusBadge.jsx';
import { areaLabel, prioridadeLabel } from '../../services/osService.js';

function formatDate(value) {
  return value ? new Date(value).toLocaleString('pt-BR') : '-';
}

export default function CcoOsDetail({ detail }) {
  if (!detail?.os) return <div className="text-slate-300">Selecione uma OS.</div>;

  const { os, historico = [], comentarios = [], anexos = [], validacoes = [] } = detail;
  const equipamentoFalha = os.payload?.equipamento_falha || os.equipamento?.nome || '-';

  return (
    <div className="grid gap-4">
      <section className="rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-2xl font-black text-white">{os.numero}</h3>
            <p className="font-bold text-slate-200">{os.titulo}</p>
          </div>
          <CcoOsStatusBadge status={os.status} />
        </div>
        <p className="mt-3 text-slate-300">{os.descricao}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Info label="Origem" value={os.origem || '-'} />
          <Info label="EBAP" value={os.ebap?.nome || '-'} />
          <Info label="Area" value={areaLabel(os.area)} />
          <Info label="Prioridade" value={prioridadeLabel(os.prioridade)} />
          <Info label="Equipamento com falha" value={equipamentoFalha} />
          <Info label="Solicitante" value={os.solicitante?.nome || '-'} />
        </div>
      </section>

      <Section icon={Paperclip} title="Fotos e anexos">
        {anexos.length ? anexos.map((anexo) => (
          <div key={anexo.id} className="rounded-2xl border border-cyan-300/10 bg-navy-950/45 p-3">
            <strong className="block truncate text-white">{anexo.nome_original}</strong>
            <small className="text-slate-400">{anexo.legenda || anexo.mime_type || 'Anexo'}</small>
          </div>
        )) : <Empty text="Nenhum anexo na OS." />}
      </Section>

      <Section icon={MessageSquare} title="Comentarios">
        {comentarios.length ? comentarios.map((comentario) => (
          <div key={comentario.id} className="rounded-2xl border border-cyan-300/10 bg-navy-950/45 p-3">
            <div className="flex flex-wrap justify-between gap-2">
              <strong className="text-white">{comentario.usuario?.nome || 'Usuario'}</strong>
              <small className="text-slate-400">{formatDate(comentario.created_at)}</small>
            </div>
            <p className="mt-1 text-sm text-slate-300">{comentario.comentario}</p>
          </div>
        )) : <Empty text="Nenhum comentario registrado." />}
      </Section>

      <Section icon={FileText} title="Historico CCO e OS">
        {[...validacoes, ...historico].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map((item) => (
          <div key={`${item.id}-${item.acao || item.status}`} className="rounded-2xl border border-cyan-300/10 bg-navy-950/45 p-3">
            <div className="flex flex-wrap justify-between gap-2">
              <strong className="text-white">{item.acao || item.status}</strong>
              <small className="text-slate-400">{formatDate(item.created_at)}</small>
            </div>
            <p className="mt-1 text-sm text-slate-300">{item.descricao || item.observacoes || item.motivo_devolucao || '-'}</p>
            <small className="text-slate-400">{item.status_anterior || '-'} para {item.status_novo || item.status || '-'}</small>
          </div>
        ))}
      </Section>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-cyan-300/10 bg-navy-950/45 p-3">
      <small className="font-black uppercase text-slate-400">{label}</small>
      <strong className="block text-white">{value}</strong>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <section className="rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-4">
      <h4 className="mb-3 flex items-center gap-2 text-lg font-black text-white">
        <Icon size={20} />
        {title}
      </h4>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

function Empty({ text }) {
  return <div className="rounded-2xl border border-cyan-300/10 bg-navy-950/45 p-4 text-sm text-slate-300">{text}</div>;
}
