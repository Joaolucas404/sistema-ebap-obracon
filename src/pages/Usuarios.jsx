import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCcw, RotateCcw, Save, ShieldOff, ShieldCheck } from 'lucide-react';
import Modal from '../components/ui/Modal.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import Toast from '../components/ui/Toast.jsx';
import { PERFIS } from '../config/permissions.js';
import {
  atualizarUsuario,
  criarUsuario,
  desativarUsuario,
  listarUsuarios,
  reativarUsuario,
  resetarSenha
} from '../services/usuariosService.js';
import { useAuthStore } from '../store/authStore.js';

const blankForm = {
  nome: '',
  usuario: '',
  senha: '',
  perfil: 'operador',
  setor: '',
  ativo: true
};

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('pt-BR');
}

export default function Usuarios() {
  const currentUser = useAuthStore((state) => state.user);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState({ type: null, user: null });
  const [form, setForm] = useState(blankForm);
  const [novaSenha, setNovaSenha] = useState('');
  const [toast, setToast] = useState({ message: '', tone: 'cyan' });
  const [error, setError] = useState('');

  const ativos = useMemo(() => usuarios.filter((usuario) => usuario.ativo).length, [usuarios]);

  async function carregarUsuarios() {
    setLoading(true);
    setError('');

    try {
      setUsuarios(await listarUsuarios());
    } catch (err) {
      setError(err.message || 'Falha ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarUsuarios();
  }, []);

  function openCreate() {
    setForm(blankForm);
    setModal({ type: 'create', user: null });
    setError('');
  }

  function openEdit(user) {
    setForm({
      nome: user.nome || '',
      usuario: user.usuario || '',
      senha: '',
      perfil: user.perfil || 'operador',
      setor: user.setor || '',
      ativo: Boolean(user.ativo)
    });
    setModal({ type: 'edit', user });
    setError('');
  }

  function openReset(user) {
    setNovaSenha('');
    setModal({ type: 'reset', user });
    setError('');
  }

  function closeModal() {
    setModal({ type: null, user: null });
    setError('');
    setSaving(false);
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (modal.type === 'create') {
        await criarUsuario({ ...form, criado_por: currentUser?.id });
        setToast({ message: 'Usuário criado com sucesso.', tone: 'green' });
      } else {
        await atualizarUsuario(modal.user.id, form);
        setToast({ message: 'Usuário atualizado com sucesso.', tone: 'green' });
      }

      await carregarUsuarios();
      closeModal();
    } catch (err) {
      setError(err.message || 'Não foi possível salvar o usuário.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(user) {
    setSaving(true);
    setError('');

    try {
      if (user.ativo) {
        await desativarUsuario(user.id);
        setToast({ message: 'Usuário desativado.', tone: 'orange' });
      } else {
        await reativarUsuario(user.id);
        setToast({ message: 'Usuário reativado.', tone: 'green' });
      }

      await carregarUsuarios();
    } catch (err) {
      setError(err.message || 'Não foi possível alterar o status.');
    } finally {
      setSaving(false);
    }
  }

  async function handleResetSenha(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await resetarSenha(modal.user.id, novaSenha);
      setToast({ message: 'Senha resetada com sucesso.', tone: 'green' });
      closeModal();
    } catch (err) {
      setError(err.message || 'Não foi possível resetar a senha.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4">
      <PageHeader
        title="Administração de Usuários"
        description="Apenas Diretoria pode criar, editar, desativar, reativar, resetar senha e alterar perfil/setor."
        actions={
          <>
            <button className="secondary-button" type="button" onClick={carregarUsuarios} disabled={loading}>
              <RefreshCcw size={17} />
              Atualizar
            </button>
            <button className="primary-button" type="button" onClick={openCreate}>
              <Plus size={18} />
              Novo usuário
            </button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-card rounded-2xl p-4">
          <small className="font-black uppercase tracking-wide text-slate-400">Total</small>
          <strong className="mt-1 block text-3xl font-black text-white">{usuarios.length}</strong>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <small className="font-black uppercase tracking-wide text-slate-400">Ativos</small>
          <strong className="mt-1 block text-3xl font-black text-green-100">{ativos}</strong>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <small className="font-black uppercase tracking-wide text-slate-400">Inativos</small>
          <strong className="mt-1 block text-3xl font-black text-orange-100">{usuarios.length - ativos}</strong>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-300/30 bg-red-500/15 p-4 text-sm font-bold text-red-100">{error}</div>}

      <section className="glass-card overflow-hidden rounded-3xl">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full border-separate border-spacing-y-2 p-3 text-left">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-400">
                <th className="px-3 py-2">Nome</th>
                <th className="px-3 py-2">Usuário</th>
                <th className="px-3 py-2">Perfil</th>
                <th className="px-3 py-2">Setor</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Último login</th>
                <th className="px-3 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="rounded-2xl bg-navy-950/55 px-3 py-6 text-center text-slate-300" colSpan={7}>
                    Carregando usuários...
                  </td>
                </tr>
              ) : usuarios.length ? (
                usuarios.map((usuario) => (
                  <tr key={usuario.id}>
                    <td className="rounded-l-2xl border-y border-l border-cyan-300/10 bg-navy-950/55 px-3 py-3 font-bold text-white">
                      {usuario.nome}
                    </td>
                    <td className="border-y border-cyan-300/10 bg-navy-950/55 px-3 py-3 text-slate-200">{usuario.usuario}</td>
                    <td className="border-y border-cyan-300/10 bg-navy-950/55 px-3 py-3">
                      <StatusBadge>{usuario.perfil}</StatusBadge>
                    </td>
                    <td className="border-y border-cyan-300/10 bg-navy-950/55 px-3 py-3 text-slate-200">{usuario.setor || '-'}</td>
                    <td className="border-y border-cyan-300/10 bg-navy-950/55 px-3 py-3">
                      <StatusBadge tone={usuario.ativo ? 'green' : 'orange'}>{usuario.ativo ? 'Ativo' : 'Inativo'}</StatusBadge>
                    </td>
                    <td className="border-y border-cyan-300/10 bg-navy-950/55 px-3 py-3 text-slate-300">{formatDate(usuario.ultimo_login)}</td>
                    <td className="rounded-r-2xl border-y border-r border-cyan-300/10 bg-navy-950/55 px-3 py-3">
                      <div className="flex justify-end gap-2">
                        <button className="secondary-button min-h-10 px-3" type="button" onClick={() => openEdit(usuario)}>
                          Editar
                        </button>
                        <button className="secondary-button min-h-10 px-3" type="button" onClick={() => openReset(usuario)}>
                          <RotateCcw size={15} />
                          Senha
                        </button>
                        <button
                          className={usuario.ativo ? 'danger-button min-h-10 px-3' : 'secondary-button min-h-10 px-3'}
                          type="button"
                          onClick={() => handleToggle(usuario)}
                          disabled={saving}
                        >
                          {usuario.ativo ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
                          {usuario.ativo ? 'Desativar' : 'Reativar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="rounded-2xl bg-navy-950/55 px-3 py-6 text-center text-slate-300" colSpan={7}>
                    Nenhum usuário cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={modal.type === 'create' || modal.type === 'edit'}
        title={modal.type === 'create' ? 'Criar usuário' : 'Editar usuário'}
        onClose={closeModal}
      >
        <form className="grid gap-4" onSubmit={handleSave}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="field-label">
              Nome
              <input className="form-control" value={form.nome} onChange={(event) => updateForm('nome', event.target.value)} />
            </label>
            <label className="field-label">
              Usuário
              <input className="form-control" value={form.usuario} onChange={(event) => updateForm('usuario', event.target.value)} />
            </label>
            {modal.type === 'create' && (
              <label className="field-label">
                Senha inicial
                <input className="form-control" type="password" value={form.senha} onChange={(event) => updateForm('senha', event.target.value)} />
              </label>
            )}
            <label className="field-label">
              Perfil
              <select className="form-control" value={form.perfil} onChange={(event) => updateForm('perfil', event.target.value)}>
                {PERFIS.map((perfil) => (
                  <option key={perfil} value={perfil}>
                    {perfil}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Setor
              <input className="form-control" value={form.setor} onChange={(event) => updateForm('setor', event.target.value)} />
            </label>
            <label className="field-label">
              Status
              <select className="form-control" value={form.ativo ? 'true' : 'false'} onChange={(event) => updateForm('ativo', event.target.value === 'true')}>
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </label>
          </div>
          {error && <div className="rounded-2xl border border-red-300/30 bg-red-500/15 p-3 text-sm font-bold text-red-100">{error}</div>}
          <div className="flex justify-end gap-2">
            <button className="secondary-button" type="button" onClick={closeModal}>
              Cancelar
            </button>
            <button className="primary-button" type="submit" disabled={saving}>
              <Save size={17} />
              Salvar
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={modal.type === 'reset'} title={`Resetar senha - ${modal.user?.nome || ''}`} onClose={closeModal}>
        <form className="grid gap-4" onSubmit={handleResetSenha}>
          <label className="field-label">
            Nova senha
            <input className="form-control" type="password" value={novaSenha} onChange={(event) => setNovaSenha(event.target.value)} />
          </label>
          {error && <div className="rounded-2xl border border-red-300/30 bg-red-500/15 p-3 text-sm font-bold text-red-100">{error}</div>}
          <div className="flex justify-end gap-2">
            <button className="secondary-button" type="button" onClick={closeModal}>
              Cancelar
            </button>
            <button className="primary-button" type="submit" disabled={saving}>
              Resetar senha
            </button>
          </div>
        </form>
      </Modal>

      <Toast message={toast.message} tone={toast.tone} onClose={() => setToast({ message: '', tone: 'cyan' })} />
    </div>
  );
}
