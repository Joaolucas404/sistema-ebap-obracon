import { useEffect, useRef, useState } from 'react';
import { Bell, Camera, Image, Info, Lock, LogOut, Settings, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import Toast from '../components/ui/Toast.jsx';
import ProfilePhotoCropModal from '../components/perfil/ProfilePhotoCropModal.jsx';
import { useAuthStore } from '../store/authStore.js';
import { enviarFotoPerfilComunicacao, obterPerfilComunicacao, resolverUrlFotoPerfil } from '../services/comunicacaoService.js';
import { areaOperacionalLabel, equipeTecnicaLabel } from '../services/usuariosService.js';

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('pt-BR');
}

function initials(name = '') {
  return String(name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function perfilLabel(perfil) {
  const labels = {
    operador: 'Operador',
    tecnico: 'Técnico',
    cco: 'CCO',
    supervisor: 'Supervisor',
    gerencia: 'Gerência',
    diretoria: 'Diretoria',
    prefeitura: 'Prefeitura',
    fiscal_operacional: 'Fiscal Operacional',
    sst: 'SST',
    administrativo: 'Administrativo',
    almoxarifado: 'Almoxarifado',
    financeiro: 'Financeiro'
  };

  return labels[perfil] || perfil || '-';
}

export default function MeuPerfil() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const updateUser = useAuthStore((state) => state.updateUser);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [photoCropFile, setPhotoCropFile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [toast, setToast] = useState({ message: '', tone: 'cyan' });

  const area = areaOperacionalLabel(user?.area_operacional || user?.area_supervisao);
  const equipe = equipeTecnicaLabel(user?.equipe);
  const cargo = user?.cargo || user?.setor || perfilLabel(user?.perfil);

  useEffect(() => {
    let alive = true;
    async function loadPhoto() {
      try {
        let source = user?.foto_url || '';
        if (!source && user?.id) {
          const perfil = await obterPerfilComunicacao(user.id);
          source = perfil?.foto_url || '';
          if (source) updateUser({ foto_url: source, cargo: perfil?.cargo || cargo });
        }
        const resolved = await resolverUrlFotoPerfil(source);
        if (alive) setPhotoUrl(resolved);
      } catch {
        if (alive) setPhotoUrl('');
      }
    }
    loadPhoto();
    return () => {
      alive = false;
    };
  }, [user?.id, user?.foto_url]);

  function handlePhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setPhotoCropFile(file);
  }

  async function saveCroppedPhoto(file) {
    setSavingPhoto(true);
    try {
      const row = await enviarFotoPerfilComunicacao(file, user);
      updateUser({ foto_url: row?.foto_url || '', cargo: row?.cargo || cargo });
      setPhotoUrl(row?.foto_url ? await resolverUrlFotoPerfil(row.foto_url) : '');
      setPhotoCropFile(null);
      setToast({ message: 'Foto de perfil atualizada.', tone: 'green' });
    } catch (err) {
      setToast({ message: err.message || 'Não foi possível alterar a foto.', tone: 'red' });
    } finally {
      setSavingPhoto(false);
    }
  }

  function handleLogout() {
    const confirmed = window.confirm('Deseja sair?');
    if (!confirmed) return;
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="grid gap-4">
      <PageHeader
        title="Meu Perfil"
        description="Dados de acesso, equipe operacional e área vinculada ao usuário logado."
        actions={<StatusBadge tone={user?.ativo ? 'blue' : 'orange'}>{user?.ativo ? 'Ativo' : 'Inativo'}</StatusBadge>}
      />

      <section className="overflow-hidden rounded-[30px] border border-blue-200/15 bg-[#10224D]/80 shadow-xl shadow-black/20">
        <div className="bg-gradient-to-br from-blue-600/30 to-[#0A1633] p-5">
          <div className="flex items-center gap-4">
            <span className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-[28px] border border-blue-200/20 bg-blue-500/15 text-3xl font-black text-white shadow-inner shadow-white/5">
              {photoUrl ? <img className="h-full w-full object-cover" src={photoUrl} alt={user?.nome || 'Perfil'} /> : initials(user?.nome || user?.usuario)}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-black text-white">{user?.nome || '-'}</h2>
              <p className="text-base font-black text-blue-100">{cargo}</p>
              <p className="mt-1 text-sm font-semibold text-slate-300">@{user?.usuario || '-'}</p>
              <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-blue-200/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-100">
                <span className="size-2 rounded-full bg-blue-400" />
                Online
              </span>
            </div>
          </div>

          <input ref={cameraInputRef} className="hidden" type="file" accept="image/*" capture="user" onChange={handlePhoto} />
          <input ref={galleryInputRef} className="hidden" type="file" accept="image/*" onChange={handlePhoto} />

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button className="secondary-button min-h-12 justify-center" type="button" onClick={() => cameraInputRef.current?.click()} disabled={savingPhoto}>
              <Camera size={18} />
              Tirar foto
            </button>
            <button className="secondary-button min-h-12 justify-center" type="button" onClick={() => galleryInputRef.current?.click()} disabled={savingPhoto}>
              <Image size={18} />
              Galeria
            </button>
          </div>
        </div>

        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          <InfoCard label="Nome completo" value={user?.nome} />
          <InfoCard label="Cargo" value={cargo} />
          <InfoCard label="Área" value={area} />
          <InfoCard label="Equipe" value={equipe} />
          <InfoCard label="Tipo de acesso" value={perfilLabel(user?.perfil)} />
          <InfoCard label="Último acesso" value={formatDate(user?.ultimo_login)} />
        </div>
      </section>

      <section className="grid gap-2 rounded-[30px] border border-blue-200/15 bg-[#10224D]/70 p-3 shadow-lg shadow-black/20">
        <MenuButton icon={UserRound} label="Meu Perfil" helper="Dados de identificação e acesso" />
        <MenuButton icon={Camera} label="Alterar Foto" helper="Tirar foto ou escolher da galeria" onClick={() => galleryInputRef.current?.click()} />
        <MenuButton icon={Settings} label="Configurações" helper="Preferências do aplicativo" />
        <MenuButton icon={Lock} label="Alterar senha" helper="Recurso preparado para próxima etapa" muted />
        <MenuButton icon={Bell} label="Notificações" helper="Preferências de avisos operacionais" muted />
        <MenuButton icon={Info} label="Sobre o aplicativo" helper="SIGEBAP Mobile - Operação em Campo" muted />
        <button className="mt-1 flex min-h-14 items-center gap-3 rounded-2xl border border-red-300/20 bg-red-500/10 px-4 text-left font-black text-red-100 transition hover:bg-red-500/15" type="button" onClick={handleLogout}>
          <LogOut size={20} />
          Sair
        </button>
      </section>

      <Toast message={toast.message} tone={toast.tone} onClose={() => setToast({ message: '', tone: 'cyan' })} />
      <ProfilePhotoCropModal
        open={Boolean(photoCropFile)}
        file={photoCropFile}
        saving={savingPhoto}
        onCancel={() => setPhotoCropFile(null)}
        onConfirm={saveCroppedPhoto}
      />
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-blue-200/10 bg-[#0A1633]/65 p-4">
      <small className="block text-xs font-black uppercase tracking-wide text-slate-400">{label}</small>
      <strong className="mt-1 block text-white">{value || '-'}</strong>
    </div>
  );
}

function MenuButton({ icon: Icon, label, helper, onClick, muted = false }) {
  return (
    <button
      className={`flex min-h-14 items-center gap-3 rounded-2xl border border-blue-200/10 px-4 text-left transition ${
        muted ? 'bg-white/[0.03] text-slate-400' : 'bg-[#0A1633]/55 text-white hover:bg-white/10'
      }`}
      type="button"
      onClick={onClick}
      disabled={!onClick && muted}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-500/15 text-blue-100">
        <Icon size={19} />
      </span>
      <span className="min-w-0">
        <strong className="block text-sm font-black">{label}</strong>
        <small className="block truncate text-xs font-semibold text-slate-400">{helper}</small>
      </span>
    </button>
  );
}
