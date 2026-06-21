import { CalendarDays, FileText, History, Paperclip, ShieldCheck } from 'lucide-react';
import { ORIENTACAO_CATEGORIAS, ORIENTACAO_STATUS, ORIENTACAO_TIPOS } from '../../services/orientacoesService.js';

function label(list, value) {
  return list.find((item) => item.value === value)?.label || value;
}

export default function OrientacaoCard({ item, canEdit, canDelete, onEdit, onDelete, onOpen, onAttachment }) {
  const anexos = (item.anexos || []).filter((anexo) => !anexo.deleted_at);
  const versoes = item.versoes || [];

  return (
    <article className="premium-card grid gap-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-cyan-300/15 px-3 py-1 text-[11px] font-black uppercase text-cyan-100">{label(ORIENTACAO_CATEGORIAS, item.categoria)}</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-black uppercase text-slate-100">{label(ORIENTACAO_TIPOS, item.tipo)}</span>
            <span className="rounded-full bg-green-300/15 px-3 py-1 text-[11px] font-black uppercase text-green-100">{label(ORIENTACAO_STATUS, item.status)}</span>
          </div>
          <h3 className="text-xl font-black leading-tight text-white">{item.titulo}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-300">{item.descricao}</p>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-navy-950/70 text-cyan-100">
          <FileText size={22} />
        </span>
      </div>

      <div className="grid gap-2 text-xs font-bold text-slate-300 sm:grid-cols-3">
        <span className="inline-flex items-center gap-2"><CalendarDays size={15} /> {item.data_referencia || item.created_at?.slice(0, 10)}</span>
        <span className="inline-flex items-center gap-2"><History size={15} /> Versão {item.versao || 1}</span>
        <span className="inline-flex items-center gap-2"><ShieldCheck size={15} /> {item.responsavel_user?.nome || item.responsavel || 'Responsável não informado'}</span>
      </div>

      {anexos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {anexos.map((anexo) => (
            <button key={anexo.id} type="button" className="secondary-button min-h-9 px-3 text-xs" onClick={() => onAttachment(anexo)}>
              <Paperclip size={14} />
              {anexo.nome}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap justify-between gap-2 border-t border-cyan-300/10 pt-3">
        <span className="text-xs font-bold text-slate-400">{versoes.length || 1} registro(s) de versão</span>
        <div className="flex flex-wrap gap-2">
          <button className="secondary-button min-h-9 px-3 text-xs" type="button" onClick={() => onOpen(item)}>Abrir</button>
          {canEdit && <button className="secondary-button min-h-9 px-3 text-xs" type="button" onClick={() => onEdit(item)}>Editar</button>}
          {canDelete && <button className="danger-button min-h-9 px-3 text-xs" type="button" onClick={() => onDelete(item)}>Excluir</button>}
        </div>
      </div>
    </article>
  );
}
