import { useEffect, useMemo, useState } from 'react';
import { BookOpen, FileUp, Plus, RefreshCcw } from 'lucide-react';
import ComunicadosPanel from '../components/orientacoes/ComunicadosPanel.jsx';
import OrientacaoCard from '../components/orientacoes/OrientacaoCard.jsx';
import OrientacaoForm, { blankOrientacao, mapOrientacaoToForm } from '../components/orientacoes/OrientacaoForm.jsx';
import OrientacoesDashboard from '../components/orientacoes/OrientacoesDashboard.jsx';
import OrientacoesFilters from '../components/orientacoes/OrientacoesFilters.jsx';
import Modal from '../components/ui/Modal.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Toast from '../components/ui/Toast.jsx';
import { ORIENTACAO_CATEGORIAS, podeCriarOrientacao, podeEditarOrientacao, podeExcluirOrientacao } from '../services/orientacoesService.js';
import { useAuthStore } from '../store/authStore.js';
import { useOrientacoesStore } from '../store/orientacoesStore.js';

function categoriaLabel(value) {
  return ORIENTACAO_CATEGORIAS.find((item) => item.value === value)?.label || value;
}

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: value.includes('T') ? 'short' : undefined }).format(new Date(value));
}

export default function Orientacoes() {
  const user = useAuthStore((state) => state.user);
  const {
    orientacoes,
    comunicados,
    dashboard,
    count,
    filters,
    loading,
    saving,
    error,
    setFilters,
    resetFilters,
    carregarTudo,
    salvar,
    excluir,
    anexar,
    abrirAnexo
  } = useOrientacoesStore();

  const [modal, setModal] = useState({ type: null, item: null });
  const [form, setForm] = useState(blankOrientacao);
  const [uploadFile, setUploadFile] = useState(null);
  const [localError, setLocalError] = useState('');
  const [toast, setToast] = useState({ message: '', tone: 'cyan' });

  const canCreate = podeCriarOrientacao(user?.perfil);
  const canEdit = podeEditarOrientacao(user?.perfil);
  const canDelete = podeExcluirOrientacao(user?.perfil);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / filters.pageSize)), [count, filters.pageSize]);

  useEffect(() => {
    carregarTudo();
  }, [filters, carregarTudo]);

  function openCreate(tipo = 'orientacao') {
    setForm({ ...blankOrientacao, tipo, responsavel: user?.nome || user?.usuario || '' });
    setLocalError('');
    setModal({ type: 'form', item: null });
  }

  function openEdit(item) {
    setForm(mapOrientacaoToForm(item));
    setLocalError('');
    setModal({ type: 'form', item });
  }

  function openDetail(item) {
    setLocalError('');
    setModal({ type: 'detail', item });
  }

  function openUpload(item) {
    setUploadFile(null);
    setLocalError('');
    setModal({ type: 'upload', item });
  }

  function closeModal() {
    setModal({ type: null, item: null });
    setUploadFile(null);
    setLocalError('');
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSave(event) {
    event.preventDefault();
    setLocalError('');

    try {
      await salvar(form, user);
      setToast({ message: form.id ? 'Orientação atualizada.' : 'Orientação cadastrada.', tone: 'green' });
      closeModal();
    } catch (err) {
      setLocalError(err.message || 'Não foi possível salvar a orientação.');
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(`Excluir a orientação "${item.titulo}"?`);
    if (!confirmed) return;

    try {
      await excluir(item.id, user);
      setToast({ message: 'Orientação excluída.', tone: 'orange' });
    } catch (err) {
      setLocalError(err.message || 'Não foi possível excluir a orientação.');
    }
  }

  async function handleUpload(event) {
    event.preventDefault();
    setLocalError('');

    try {
      await anexar(modal.item.id, uploadFile, user);
      setToast({ message: 'Arquivo anexado.', tone: 'green' });
      closeModal();
    } catch (err) {
      setLocalError(err.message || 'Não foi possível anexar o arquivo.');
    }
  }

  return (
    <div className="grid gap-4">
      <PageHeader
        title="Orientações Operacionais"
        description="Central de conhecimento do SIGEBAP Vila Velha com procedimentos, comunicados, arquivos e controle de versão."
        leading={
          <span className="grid size-12 place-items-center rounded-2xl bg-navy-950/60 text-cyan-100">
            <BookOpen size={24} />
          </span>
        }
        actions={
          <>
            <button className="secondary-button" type="button" onClick={carregarTudo} disabled={loading}>
              <RefreshCcw size={17} />
              Atualizar
            </button>
            {canCreate && (
              <>
                <button className="secondary-button" type="button" onClick={() => openCreate('comunicado')}>
                  <Plus size={18} />
                  Novo comunicado
                </button>
                <button className="primary-button" type="button" onClick={() => openCreate('orientacao')}>
                  <Plus size={18} />
                  Nova orientação
                </button>
              </>
            )}
          </>
        }
      />

      {(error || localError) && (
        <div className="rounded-2xl border border-red-300/30 bg-red-500/15 p-4 text-sm font-bold text-red-100">
          {localError || error}
        </div>
      )}

      <OrientacoesDashboard dashboard={dashboard} />
      <ComunicadosPanel comunicados={comunicados} onSelect={openDetail} />
      <OrientacoesFilters filters={filters} onChange={setFilters} onReset={resetFilters} />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4">
          {loading ? (
            <div className="page-surface p-8 text-center text-sm font-black text-cyan-100">Carregando orientações...</div>
          ) : orientacoes.length === 0 ? (
            <div className="page-surface p-8 text-center">
              <BookOpen className="mx-auto text-cyan-100" size={42} />
              <h3 className="mt-4 text-xl font-black text-white">Nenhuma orientação encontrada</h3>
              <p className="mt-2 text-sm text-slate-300">Ajuste os filtros ou cadastre uma nova orientação operacional.</p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {orientacoes.map((item) => (
                <OrientacaoCard
                  key={item.id}
                  item={item}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onOpen={openDetail}
                  onAttachment={abrirAnexo}
                />
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-bold text-slate-300">
            <span>Página {filters.page} de {totalPages} • {count} registro(s)</span>
            <div className="flex gap-2">
              <button className="secondary-button" type="button" disabled={filters.page <= 1} onClick={() => setFilters({ page: filters.page - 1 })}>Anterior</button>
              <button className="secondary-button" type="button" disabled={filters.page >= totalPages} onClick={() => setFilters({ page: filters.page + 1 })}>Próxima</button>
            </div>
          </div>
        </div>

        <aside className="page-surface h-fit">
          <h3 className="text-lg font-black text-white">Categorias</h3>
          <div className="mt-4 grid gap-2">
            {(dashboard?.porCategoria || []).map((item) => (
              <button
                key={item.value}
                type="button"
                className="flex items-center justify-between rounded-2xl border border-cyan-200/10 bg-navy-950/45 px-4 py-3 text-left transition hover:border-cyan-200/30"
                onClick={() => setFilters({ categoria: item.value })}
              >
                <span className="text-sm font-black text-white">{item.label}</span>
                <span className="rounded-full bg-cyan-300/15 px-3 py-1 text-xs font-black text-cyan-100">{item.total}</span>
              </button>
            ))}
          </div>
        </aside>
      </section>

      <Modal open={modal.type === 'form'} title={form.id ? 'Editar orientação' : 'Nova orientação'} onClose={closeModal}>
        {localError && <div className="mb-4 rounded-2xl border border-red-300/30 bg-red-500/15 p-3 text-sm font-bold text-red-100">{localError}</div>}
        <OrientacaoForm
          form={form}
          saving={saving}
          canEditStatus={canEdit || !form.id}
          onChange={updateForm}
          onSubmit={handleSave}
          onCancel={closeModal}
        />
      </Modal>

      <Modal open={modal.type === 'detail'} title={modal.item?.titulo || 'Orientação'} onClose={closeModal}>
        {modal.item && (
          <div className="grid gap-5">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-cyan-300/15 px-3 py-1 text-xs font-black uppercase text-cyan-100">{categoriaLabel(modal.item.categoria)}</span>
              <span className="rounded-full bg-green-300/15 px-3 py-1 text-xs font-black uppercase text-green-100">v{modal.item.versao}</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase text-slate-100">{modal.item.status}</span>
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-[0.12em] text-cyan-100">Descrição</h4>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-200">{modal.item.descricao}</p>
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-[0.12em] text-cyan-100">Passo a passo</h4>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-100">{modal.item.conteudo}</p>
            </div>
            <div className="grid gap-2 text-sm text-slate-300 md:grid-cols-2">
              <span><strong className="text-white">Responsável:</strong> {modal.item.responsavel_user?.nome || modal.item.responsavel || '-'}</span>
              <span><strong className="text-white">Atualizado em:</strong> {formatDate(modal.item.updated_at)}</span>
            </div>
            {(modal.item.anexos || []).filter((anexo) => !anexo.deleted_at).length > 0 && (
              <div>
                <h4 className="mb-3 text-sm font-black uppercase tracking-[0.12em] text-cyan-100">Anexos</h4>
                <div className="flex flex-wrap gap-2">
                  {modal.item.anexos.filter((anexo) => !anexo.deleted_at).map((anexo) => (
                    <button key={anexo.id} type="button" className="secondary-button" onClick={() => abrirAnexo(anexo)}>{anexo.nome}</button>
                  ))}
                </div>
              </div>
            )}
            {canCreate && (
              <button className="secondary-button justify-self-start" type="button" onClick={() => openUpload(modal.item)}>
                <FileUp size={17} />
                Anexar arquivo
              </button>
            )}
            {(modal.item.versoes || []).length > 0 && (
              <div>
                <h4 className="mb-3 text-sm font-black uppercase tracking-[0.12em] text-cyan-100">Controle de versão</h4>
                <div className="grid gap-2">
                  {modal.item.versoes
                    .slice()
                    .sort((a, b) => b.versao - a.versao)
                    .map((versao) => (
                      <div key={versao.id} className="rounded-2xl border border-cyan-200/10 bg-navy-950/45 p-3 text-sm text-slate-300">
                        <strong className="text-white">v{versao.versao}</strong> • {formatDate(versao.created_at)} • {versao.status}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={modal.type === 'upload'} title="Anexar arquivo" onClose={closeModal}>
        {localError && <div className="mb-4 rounded-2xl border border-red-300/30 bg-red-500/15 p-3 text-sm font-bold text-red-100">{localError}</div>}
        <form className="grid gap-4" onSubmit={handleUpload}>
          <p className="text-sm leading-6 text-slate-300">Arquivos aceitos: PDF, DOCX, imagens e planilhas.</p>
          <label className="field-label">
            Arquivo
            <input className="form-control py-3" type="file" required onChange={(event) => setUploadFile(event.target.files?.[0] || null)} />
          </label>
          <div className="flex justify-end gap-2">
            <button className="secondary-button" type="button" onClick={closeModal}>Cancelar</button>
            <button className="primary-button" type="submit" disabled={saving || !uploadFile}>{saving ? 'Enviando...' : 'Enviar arquivo'}</button>
          </div>
        </form>
      </Modal>

      <Toast message={toast.message} tone={toast.tone} onClose={() => setToast({ message: '', tone: 'cyan' })} />
    </div>
  );
}
