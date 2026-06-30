import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Plus, RefreshCcw, RotateCcw, Save, ShieldCheck, ShieldOff, Trash2, XCircle } from 'lucide-react';
import Modal from '../components/ui/Modal.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import Toast from '../components/ui/Toast.jsx';
import { PERFIS } from '../config/permissions.js';
import {
  AREAS_OPERACIONAIS,
  EQUIPES_TECNICAS,
  aprovarAcessoTecnico,
  atualizarUsuario,
  areaOperacionalLabel,
  criarUsuario,
  desativarUsuario,
  equipeTecnicaLabel,
  excluirUsuario,
  listarAcessosPendentes,
  listarUsuarios,
  podeAprovarTecnicos,
  podeGerenciarUsuarios,
  reativarUsuario,
  rejeitarAcessoTecnico,
  resetarSenha
} from '../services/usuariosService.js';
import { useAuthStore } from '../store/authStore.js';

const blankForm = {
  nome: '',
  usuario: '',
  senha: '',
  perfil: 'operador',
  setor: '',
  area_operacional: '',
  equipe: '',
  ativo: true
};

const AUTO_AREA_BY_PROFILE = {
  sst: 'sst',
  administrativo: 'administrativo',
  almoxarifado: 'almoxarifado',
  financeiro: 'financeiro',
  cco: 'cco',
  prefeitura: 'prefeitura',
  fiscal_operacional: 'prefeitura'
};

const USERS_PER_PAGE = 10;

function canEditUser(currentUser, targetUser) {
  if (currentUser?.perfil === 'diretoria' || currentUser?.perfil === 'administrador') return true;
  if (currentUser?.perfil === 'gerencia') return !['diretoria', 'gerencia', 'administrador'].includes(targetUser?.perfil);
  return false;
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('pt-BR');
}

export default function Usuarios() {
  const currentUser = useAuthStore((state) => state.user);
  const [usuarios, setUsuarios] = useState([]);
  const [pendentes, setPendentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState({ type: null, user: null });
  const [form, setForm] = useState(blankForm);
  const [novaSenha, setNovaSenha] = useState('');
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  const [usuariosPage, setUsuariosPage] = useState(1);
  const [toast, setToast] = useState({ message: '', tone: 'cyan' });
  const [error, setError] = useState('');

  const canManageUsers = podeGerenciarUsuarios(currentUser);
  const canApproveAccess = podeAprovarTecnicos(currentUser);
  const canDeleteUsers = currentUser?.perfil === 'diretoria' || currentUser?.perfil === 'administrador';
  const ativos = useMemo(() => usuarios.filter((usuario) => usuario.ativo).length, [usuarios]);
  const usuariosTotalPages = useMemo(() => Math.max(1, Math.ceil(usuarios.length / USERS_PER_PAGE)), [usuarios.length]);
  const usuariosPaginados = useMemo(() => {
    const start = (usuariosPage - 1) * USERS_PER_PAGE;
    return usuarios.slice(start, start + USERS_PER_PAGE);
  }, [usuarios, usuariosPage]);
  const usuariosStart = usuarios.length ? (usuariosPage - 1) * USERS_PER_PAGE + 1 : 0;
  const usuariosEnd = Math.min(usuariosPage * USERS_PER_PAGE, usuarios.length);
  const perfisDisponiveis = useMemo(
    () => currentUser?.perfil === 'gerencia' ? PERFIS.filter((perfil) => !['diretoria', 'gerencia'].includes(perfil)) : PERFIS,
    [currentUser?.perfil]
  );

  async function carregarUsuarios() {
    setLoading(true);
    setError('');

    try {
      const [usuariosRows, pendentesRows] = await Promise.all([
        canManageUsers ? listarUsuarios() : Promise.resolve([]),
        canApproveAccess ? listarAcessosPendentes(currentUser) : Promise.resolve([])
      ]);
      setUsuarios(usuariosRows);
      setPendentes(pendentesRows);
    } catch (err) {
      setError(err.message || 'Falha ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarUsuarios();
  }, [currentUser?.id, currentUser?.perfil, currentUser?.area_operacional, currentUser?.area_supervisao]);

  useEffect(() => {
    if (usuariosPage > usuariosTotalPages) setUsuariosPage(usuariosTotalPages);
  }, [usuariosPage, usuariosTotalPages]);

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
      area_operacional: user.area_operacional || user.area_supervisao || '',
      equipe: user.equipe || '',
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

  function openDelete(user) {
    setModal({ type: 'delete', user });
    setError('');
  }

  function openReject(user) {
    setMotivoRejeicao('');
    setModal({ type: 'reject-access', user });
    setError('');
  }

  function closeModal() {
    setModal({ type: null, user: null });
    setError('');
    setSaving(false);
  }

  function updateForm(field, value) {
    setForm((current) => {
      if (field === 'perfil') {
        return { ...current, perfil: value, area_operacional: AUTO_AREA_BY_PROFILE[value] || current.area_operacional };
      }
      if (field === 'equipe') {
        const selected = EQUIPES_TECNICAS.find((equipe) => equipe.value === value);
        return { ...current, equipe: value, area_operacional: selected?.area || current.area_operacional, setor: selected?.label || current.setor };
      }
      return { ...current, [field]: value };
    });
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (modal.type === 'create') {
        await criarUsuario({ ...form, criado_por: currentUser?.id }, currentUser);
        setToast({ message: 'Usuário criado com sucesso.', tone: 'green' });
      } else {
        await atualizarUsuario(modal.user.id, form, currentUser);
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

  async function handleDeleteUser() {
    if (!modal.user) return;
    if (modal.user.id === currentUser?.id) {
      setError('Você não pode excluir o próprio usuário logado.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await excluirUsuario(modal.user.id, currentUser?.id);
      setToast({ message: 'Usuário excluído permanentemente. Login liberado.', tone: 'orange' });
      await carregarUsuarios();
      closeModal();
    } catch (err) {
      setError(err.message || 'Não foi possível excluir o usuário.');
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

  async function handleAprovarPendente(user) {
    setSaving(true);
    setError('');
    try {
      await aprovarAcessoTecnico(user.id, currentUser);
      setToast({ message: 'Acesso técnico aprovado.', tone: 'green' });
      await carregarUsuarios();
    } catch (err) {
      setError(err.message || 'Não foi possível aprovar o acesso.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRejeitarPendente(event) {
    event.preventDefault();
    if (!modal.user) return;
    setSaving(true);
    setError('');
    try {
      await rejeitarAcessoTecnico(modal.user.id, currentUser, motivoRejeicao);
      setToast({ message: 'Acesso técnico rejeitado. Login liberado para novo cadastro.', tone: 'orange' });
      await carregarUsuarios();
      closeModal();
    } catch (err) {
      setError(err.message || 'Não foi possível rejeitar o acesso.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4">
      <PageHeader
        title="Administração de Usuários"
        description="Gestão de usuários, áreas operacionais e aprovação de primeiro acesso técnico."
        actions={
          <>
            <button className="secondary-button" type="button" onClick={carregarUsuarios} disabled={loading}>
              <RefreshCcw size={17} />
              Atualizar
            </button>
            {canManageUsers && (
              <button className="primary-button" type="button" onClick={openCreate}>
                <Plus size={18} />
                Novo usuário
              </button>
            )}
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Total" value={usuarios.length} />
        <Metric label="Ativos" value={ativos} tone="green" />
        <Metric label="Inativos" value={usuarios.length - ativos} tone="orange" />
        <Metric label="Acessos Pendentes" value={pendentes.length} tone="cyan" />
      </div>

      {error && <div className="rounded-2xl border border-red-300/30 bg-red-500/15 p-4 text-sm font-bold text-red-100">{error}</div>}

      {canApproveAccess && (
        <section className="glass-card overflow-hidden rounded-3xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-300/10 px-5 py-4">
            <div>
              <h2 className="text-xl font-black text-white">Acessos Pendentes</h2>
              <p className="text-sm font-semibold text-slate-300">Solicitações de primeiro acesso técnico conforme a hierarquia de supervisão.</p>
            </div>
            <StatusBadge tone={pendentes.length ? 'orange' : 'green'}>{pendentes.length} pendente(s)</StatusBadge>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[840px] w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3">Nome</th>
                  <th className="px-5 py-3">Login</th>
                  <th className="px-5 py-3">Equipe</th>
                  <th className="px-5 py-3">Data Solicitação</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-300/10">
                {pendentes.map((usuario) => (
                  <tr key={usuario.id} className="bg-navy-950/35">
                    <td className="px-5 py-3 font-bold text-white">{usuario.nome}</td>
                    <td className="px-5 py-3 text-slate-200">{usuario.usuario}</td>
                    <td className="px-5 py-3 text-slate-200">{equipeTecnicaLabel(usuario.equipe)}</td>
                    <td className="px-5 py-3 text-slate-300">{formatDate(usuario.criado_em)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <button className="primary-button min-h-10 px-3" type="button" onClick={() => handleAprovarPendente(usuario)} disabled={saving}>
                          <CheckCircle2 size={15} />
                          Aprovar
                        </button>
                        <button className="danger-button min-h-10 px-3" type="button" onClick={() => openReject(usuario)} disabled={saving}>
                          <XCircle size={15} />
                          Rejeitar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!pendentes.length && (
                  <tr>
                    <td className="px-5 py-8 text-center font-bold text-slate-300" colSpan={5}>Nenhum acesso pendente para sua área.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {canManageUsers && (
        <section className="glass-card overflow-hidden rounded-3xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-300/10 px-5 py-4">
            <div>
              <h2 className="text-xl font-black text-white">Usuários cadastrados</h2>
              <p className="text-sm font-semibold text-slate-300">Exibindo 10 usuários por página para facilitar a navegação.</p>
            </div>
            <StatusBadge tone="cyan">{usuarios.length} usuário(s)</StatusBadge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] table-fixed border-separate border-spacing-y-2 p-3 text-left xl:min-w-0">
              <colgroup>
                <col className="w-[120px]" />
                <col className="w-[86px]" />
                <col className="w-[110px]" />
                <col className="w-[82px]" />
                <col className="w-[100px]" />
                <col className="w-[86px]" />
                <col className="w-[96px]" />
                <col className="w-[78px]" />
                <col className="w-[108px]" />
                <col className="w-[330px]" />
              </colgroup>
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-3 py-2">Nome</th>
                  <th className="px-3 py-2">Usuário</th>
                  <th className="px-3 py-2">Perfil</th>
                  <th className="px-3 py-2">Setor</th>
                  <th className="px-3 py-2">Área Operacional</th>
                  <th className="px-3 py-2">Equipe</th>
                  <th className="px-3 py-2">Aprovação</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Último login</th>
                  <th className="px-3 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="rounded-2xl bg-navy-950/55 px-3 py-6 text-center text-slate-300" colSpan={10}>Carregando usuários...</td>
                  </tr>
                ) : usuarios.length ? (
                  usuariosPaginados.map((usuario) => (
                    <tr key={usuario.id}>
                      <td className="rounded-l-2xl border-y border-l border-cyan-300/10 bg-navy-950/55 px-3 py-3 font-bold text-white">
                        <span className="block break-words">{usuario.nome}</span>
                      </td>
                      <td className="border-y border-cyan-300/10 bg-navy-950/55 px-3 py-3 text-slate-200">
                        <span className="block break-words">{usuario.usuario}</span>
                      </td>
                      <td className="border-y border-cyan-300/10 bg-navy-950/55 px-3 py-3"><StatusBadge>{usuario.perfil}</StatusBadge></td>
                      <td className="border-y border-cyan-300/10 bg-navy-950/55 px-3 py-3 text-slate-200">
                        <span className="block break-words">{usuario.setor || '-'}</span>
                      </td>
                      <td className="border-y border-cyan-300/10 bg-navy-950/55 px-3 py-3 text-slate-200">
                        <span className="block break-words">{areaOperacionalLabel(usuario.area_operacional || usuario.area_supervisao)}</span>
                      </td>
                      <td className="border-y border-cyan-300/10 bg-navy-950/55 px-3 py-3 text-slate-200">
                        <span className="block break-words">{equipeTecnicaLabel(usuario.equipe)}</span>
                      </td>
                      <td className="border-y border-cyan-300/10 bg-navy-950/55 px-3 py-3">
                        <StatusBadge tone={usuario.status_aprovacao === 'pendente' ? 'orange' : usuario.status_aprovacao === 'rejeitado' ? 'red' : 'green'}>
                          {usuario.status_aprovacao || 'aprovado'}
                        </StatusBadge>
                      </td>
                      <td className="border-y border-cyan-300/10 bg-navy-950/55 px-3 py-3">
                        <StatusBadge tone={usuario.ativo ? 'green' : 'orange'}>{usuario.ativo ? 'Ativo' : 'Inativo'}</StatusBadge>
                      </td>
                      <td className="border-y border-cyan-300/10 bg-navy-950/55 px-3 py-3 text-slate-300">{formatDate(usuario.ultimo_login)}</td>
                      <td className="rounded-r-2xl border-y border-r border-cyan-300/10 bg-navy-950/55 px-3 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button className="secondary-button min-h-10 px-3 text-sm" type="button" onClick={() => openEdit(usuario)} disabled={!canEditUser(currentUser, usuario)}>Editar</button>
                          <button className="secondary-button min-h-10 px-3 text-sm" type="button" onClick={() => openReset(usuario)} disabled={!canEditUser(currentUser, usuario)}>
                            <RotateCcw size={15} />
                            Senha
                          </button>
                          <button className={usuario.ativo ? 'danger-button min-h-10 px-3 text-sm' : 'secondary-button min-h-10 px-3 text-sm'} type="button" onClick={() => handleToggle(usuario)} disabled={saving || !canEditUser(currentUser, usuario)}>
                            {usuario.ativo ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
                            {usuario.ativo ? 'Desativar' : 'Reativar'}
                          </button>
                          {canDeleteUsers && (
                            <button className="danger-button min-h-10 px-3 text-sm" type="button" onClick={() => openDelete(usuario)} disabled={saving || usuario.id === currentUser?.id}>
                              <Trash2 size={15} />
                              Excluir
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="rounded-2xl bg-navy-950/55 px-3 py-6 text-center text-slate-300" colSpan={10}>Nenhum usuário cadastrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-cyan-300/10 px-5 py-4 text-sm font-bold text-slate-300 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Mostrando {usuariosStart}-{usuariosEnd} de {usuarios.length} usuário(s)
            </span>
            <div className="flex flex-wrap gap-2">
              <button className="secondary-button min-h-10 px-3" type="button" disabled={usuariosPage <= 1} onClick={() => setUsuariosPage((page) => Math.max(1, page - 1))}>
                Anterior
              </button>
              {Array.from({ length: usuariosTotalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  className={page === usuariosPage ? 'primary-button min-h-10 min-w-10 px-3' : 'secondary-button min-h-10 min-w-10 px-3'}
                  type="button"
                  onClick={() => setUsuariosPage(page)}
                >
                  {page}
                </button>
              ))}
              <button className="secondary-button min-h-10 px-3" type="button" disabled={usuariosPage >= usuariosTotalPages} onClick={() => setUsuariosPage((page) => Math.min(usuariosTotalPages, page + 1))}>
                Próxima
              </button>
            </div>
          </div>
        </section>
      )}

      <Modal open={modal.type === 'create' || modal.type === 'edit'} title={modal.type === 'create' ? 'Criar usuário' : 'Editar usuário'} onClose={closeModal}>
        <form className="grid gap-4" onSubmit={handleSave}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Nome" value={form.nome} onChange={(value) => updateForm('nome', value)} />
            <Input label="Usuário" value={form.usuario} onChange={(value) => updateForm('usuario', value)} />
            {modal.type === 'create' && <Input label="Senha inicial" type="password" value={form.senha} onChange={(value) => updateForm('senha', value)} />}
            <label className="field-label">
              Perfil
              <select className="form-control" value={form.perfil} onChange={(event) => updateForm('perfil', event.target.value)}>
                {perfisDisponiveis.map((perfil) => <option key={perfil} value={perfil}>{perfil}</option>)}
              </select>
            </label>
            <Input label="Setor" value={form.setor} onChange={(value) => updateForm('setor', value)} />
            {form.perfil === 'tecnico' && (
              <label className="field-label">
                Equipe
                <select className="form-control" value={form.equipe} onChange={(event) => updateForm('equipe', event.target.value)} required>
                  <option value="">Selecione...</option>
                  {EQUIPES_TECNICAS.map((equipe) => <option key={equipe.value} value={equipe.value}>{equipe.label}</option>)}
                </select>
              </label>
            )}
            <label className="field-label">
              Área Operacional
              <select className="form-control" value={form.area_operacional} onChange={(event) => updateForm('area_operacional', event.target.value)} required={['supervisor', 'tecnico'].includes(form.perfil)}>
                <option value="">Selecione...</option>
                {AREAS_OPERACIONAIS.map((area) => <option key={area.value} value={area.value}>{area.label}</option>)}
              </select>
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
            <button className="secondary-button" type="button" onClick={closeModal}>Cancelar</button>
            <button className="primary-button" type="submit" disabled={saving}>
              <Save size={17} />
              Salvar
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={modal.type === 'reset'} title={`Resetar senha - ${modal.user?.nome || ''}`} onClose={closeModal}>
        <form className="grid gap-4" onSubmit={handleResetSenha}>
          <Input label="Nova senha" type="password" value={novaSenha} onChange={setNovaSenha} />
          {error && <div className="rounded-2xl border border-red-300/30 bg-red-500/15 p-3 text-sm font-bold text-red-100">{error}</div>}
          <div className="flex justify-end gap-2">
            <button className="secondary-button" type="button" onClick={closeModal}>Cancelar</button>
            <button className="primary-button" type="submit" disabled={saving}>Resetar senha</button>
          </div>
        </form>
      </Modal>

      <Modal open={modal.type === 'delete'} title={`Excluir usuário - ${modal.user?.nome || ''}`} onClose={closeModal}>
        <div className="grid gap-4">
          <div className="rounded-2xl border border-red-300/30 bg-red-500/15 p-4 text-sm font-bold text-red-100">Esta ação exclui o usuário do banco e libera o mesmo login para novo cadastro. Históricos antigos permanecem vinculados quando o banco permitir referência nula.</div>
          {error && <div className="rounded-2xl border border-red-300/30 bg-red-500/15 p-3 text-sm font-bold text-red-100">{error}</div>}
          <div className="flex justify-end gap-2">
            <button className="secondary-button" type="button" onClick={closeModal}>Cancelar</button>
            <button className="danger-button" type="button" onClick={handleDeleteUser} disabled={saving}>
              <Trash2 size={17} />
              Excluir usuário
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={modal.type === 'reject-access'} title={`Rejeitar acesso - ${modal.user?.nome || ''}`} onClose={closeModal}>
        <form className="grid gap-4" onSubmit={handleRejeitarPendente}>
          <div className="rounded-2xl border border-orange-300/25 bg-orange-500/15 p-4 text-sm font-bold text-orange-100">Informe o motivo da rejeição. O usuário continuará sem acesso ao sistema.</div>
          <label className="field-label">
            Motivo obrigatório
            <textarea className="form-control min-h-24 py-3" value={motivoRejeicao} onChange={(event) => setMotivoRejeicao(event.target.value)} required />
          </label>
          {error && <div className="rounded-2xl border border-red-300/30 bg-red-500/15 p-3 text-sm font-bold text-red-100">{error}</div>}
          <div className="flex justify-end gap-2">
            <button className="secondary-button" type="button" onClick={closeModal}>Cancelar</button>
            <button className="danger-button" type="submit" disabled={saving}>
              <XCircle size={17} />
              Rejeitar acesso
            </button>
          </div>
        </form>
      </Modal>

      <Toast message={toast.message} tone={toast.tone} onClose={() => setToast({ message: '', tone: 'cyan' })} />
    </div>
  );
}

function Metric({ label, value, tone = 'cyan' }) {
  const colors = {
    cyan: 'text-cyan-100',
    green: 'text-green-100',
    orange: 'text-orange-100'
  };

  return (
    <div className="glass-card rounded-2xl p-4">
      <small className="font-black uppercase tracking-wide text-slate-400">{label}</small>
      <strong className={`mt-1 block text-3xl font-black ${colors[tone] || colors.cyan}`}>{value}</strong>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }) {
  return (
    <label className="field-label">
      {label}
      <input className="form-control" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
