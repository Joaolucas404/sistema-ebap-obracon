import { useEffect, useState } from 'react';
import { Download, FileSearch, RefreshCcw, Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { supabase } from '../lib/supabase.js';

function normalizeArchive(row, source) {
  if (!row) return null;
  if (source === 'arquivo_pdf') {
    return {
      id: row.id,
      document_number: row.codigo,
      entity_type: row.entidade_tipo,
      entity_id: row.entidade_id,
      title: row.titulo,
      bucket: row.bucket,
      path: row.path,
      generated_by: row.gerado_por,
      created_at: row.created_at,
      source
    };
  }

  return { ...row, source };
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('pt-BR');
}

export default function ArquivoRelatorios() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialDoc = searchParams.get('doc') || '';
  const [search, setSearch] = useState(initialDoc);
  const [documento, setDocumento] = useState(null);
  const [signedUrl, setSignedUrl] = useState('');
  const [loading, setLoading] = useState(Boolean(initialDoc));
  const [error, setError] = useState('');

  async function buscarDocumento(documentNumber = search.trim()) {
    if (!documentNumber) {
      setDocumento(null);
      setSignedUrl('');
      setError('');
      return;
    }

    setLoading(true);
    setError('');
    setSignedUrl('');

    try {
      let found = null;
      const archiveResult = await supabase
        .from('archive_documents')
        .select('*')
        .eq('document_number', documentNumber)
        .is('deleted_at', null)
        .maybeSingle();

      if (archiveResult.error) throw new Error(archiveResult.error.message);
      found = normalizeArchive(archiveResult.data, 'archive_documents');

      if (!found) {
        const fallbackResult = await supabase
          .from('arquivo_pdf')
          .select('*')
          .eq('codigo', documentNumber)
          .is('deleted_at', null)
          .maybeSingle();

        if (fallbackResult.error) throw new Error(fallbackResult.error.message);
        found = normalizeArchive(fallbackResult.data, 'arquivo_pdf');
      }

      if (!found) {
        setDocumento(null);
        setError('Documento nao encontrado no arquivo.');
        return;
      }

      const urlResult = await supabase.storage.from(found.bucket).createSignedUrl(found.path, 3600);
      if (urlResult.error) throw new Error(urlResult.error.message);

      setDocumento(found);
      setSignedUrl(urlResult.data?.signedUrl || '');
      setSearchParams({ doc: found.document_number, tipo: found.entity_type, id: found.entity_id });
    } catch (err) {
      setDocumento(null);
      setError(err.message || 'Não foi possível consultar o documento.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialDoc) buscarDocumento(initialDoc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid gap-4">
      <PageHeader
        title="Arquivo PDF e Rastreabilidade"
        description="Consulta de documentos gerados pelo numero unico ou QR Code."
        leading={
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-100">
            <FileSearch size={24} />
          </div>
        }
      />

      <section className="glass-card rounded-3xl p-5">
        <form
          className="grid gap-3 md:grid-cols-[1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            buscarDocumento();
          }}
        >
          <label className="field-label">
            Numero do documento
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cyan-100" size={18} />
              <input
                className="form-control pl-10"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ex.: PDF-RDO-20260619-3027053"
              />
            </div>
          </label>
          <button type="submit" className="primary-button self-end" disabled={loading}>
            <RefreshCcw size={17} className={loading ? 'animate-spin' : ''} />
            Consultar
          </button>
        </form>
      </section>

      {error && <div className="rounded-2xl border border-red-300/30 bg-red-500/15 p-4 text-sm font-bold text-red-100">{error}</div>}

      {documento ? (
        <section className="glass-card rounded-3xl p-5">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <span className="text-xs font-black uppercase text-slate-400">Documento</span>
              <strong className="mt-1 block text-white">{documento.document_number}</strong>
            </div>
            <div>
              <span className="text-xs font-black uppercase text-slate-400">Titulo</span>
              <strong className="mt-1 block text-white">{documento.title}</strong>
            </div>
            <div>
              <span className="text-xs font-black uppercase text-slate-400">Tipo</span>
              <strong className="mt-1 block text-white">{documento.entity_type}</strong>
            </div>
            <div>
              <span className="text-xs font-black uppercase text-slate-400">Gerado em</span>
              <strong className="mt-1 block text-white">{formatDate(documento.created_at)}</strong>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <a className="primary-button" href={signedUrl} target="_blank" rel="noreferrer">
              <Download size={17} />
              Abrir PDF
            </a>
          </div>
        </section>
      ) : (
        !loading && !error && (
          <EmptyState
            title="Consulte um documento"
            description="Use o numero impresso no PDF ou leia o QR Code para localizar o arquivo digital."
          />
        )
      )}
    </div>
  );
}
