import { Download, FileArchive, FileText } from 'lucide-react';

function dateTime(value) {
  return value ? new Date(value).toLocaleString('pt-BR') : '-';
}

export default function FinanceiroDocuments({ documentos, onOpen }) {
  if (!documentos.length) {
    return <div className="glass-card rounded-3xl p-8 text-center text-sm font-bold text-slate-300">Nenhum documento financeiro anexado.</div>;
  }

  return (
    <section className="grid gap-3">
      {documentos.map((documento) => (
        <article key={documento.id} className="glass-card rounded-3xl p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-navy-950/60 text-cyan-100">
                {documento.mime_type?.includes('pdf') ? <FileText size={21} /> : <FileArchive size={21} />}
              </span>
              <div>
                <h3 className="font-black text-white">{documento.nome}</h3>
                <p className="text-sm text-slate-300">
                  {documento.entidade_tipo.replaceAll('_', ' ')} · {dateTime(documento.created_at)}
                </p>
                <p className="text-xs text-slate-500">{documento.uploaded_by_user?.nome || 'Usuário não informado'}</p>
              </div>
            </div>
            <button className="secondary-button" type="button" onClick={() => onOpen(documento)}>
              <Download size={17} />
              Abrir
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}
