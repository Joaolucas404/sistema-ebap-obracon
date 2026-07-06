import { useState } from 'react';
import { CheckCircle2, Lock, LogIn, User, UserPlus } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loginWithUsuarioSenha } from '../services/authService.js';
import { EQUIPES_TECNICAS, solicitarAcessoTecnico } from '../services/usuariosService.js';
import { START_ROUTE_BY_ROLE, normalizePerfil } from '../config/permissions.js';
import { BRAND } from '../config/brand.js';
import Modal from '../components/ui/Modal.jsx';
import { useAuthStore } from '../store/authStore.js';

const LOGIN_COPY = {
  titlePrefix: 'SIGEBAP',
  titleHighlight: 'Vila Velha',
  title: 'SIGEBAP Vila Velha',
  subtitle: 'Sistema Integrado de Gestão das Estações de Bombeamento de Águas Pluviais de Vila Velha',
  description: 'Plataforma operacional integrada para monitoramento, manutenção, segurança, contratos e gestão das EBAPs do Município de Vila Velha.',
  version: '0.1.0'
};

const INSTITUTIONAL_ASSETS = {
  hero: '/brand/morro-do-moreno.jpg',
  prefeitura: '/brand/prefeitura-vila-velha.png',
  vilaVelhaFlag: '/brand/bandeira-vila-velha.png',
  espiritoSantoFlag: '/brand/bandeira-espirito-santo.png'
};

const INDICATORS = [
  '11 EBAPs Monitoradas',
  'Centro de Controle Operacional',
  'Operação e Manutenção',
  'Segurança do Trabalho',
  'Almoxarifado',
  'Gestão de Contratos'
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((state) => state.setSession);
  const [form, setForm] = useState({ usuario: '', senha: '' });
  const [accessOpen, setAccessOpen] = useState(false);
  const [accessForm, setAccessForm] = useState({ nome: '', usuario: '', senha: '', confirmarSenha: '', equipe: '' });
  const [loading, setLoading] = useState(false);
  const [accessLoading, setAccessLoading] = useState(false);
  const [error, setError] = useState('');
  const [accessMessage, setAccessMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await loginWithUsuarioSenha(form.usuario, form.senha);
      setSession(user);
      const destination = location.state?.from?.pathname || START_ROUTE_BY_ROLE[normalizePerfil(user.perfil)] || '/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message || 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSolicitarAcesso(event) {
    event.preventDefault();
    setError('');
    setAccessMessage('');
    setAccessLoading(true);

    try {
      await solicitarAcessoTecnico(accessForm);
      setAccessMessage('Solicitação enviada. Aguarde a aprovação do Supervisor da sua área.');
      setAccessForm({ nome: '', usuario: '', senha: '', confirmarSenha: '', equipe: '' });
    } catch (err) {
      setAccessMessage(err.message || 'Não foi possível solicitar o acesso.');
    } finally {
      setAccessLoading(false);
    }
  }

  return (
    <div className="app-bg">
      <div className="content-layer grid min-h-screen place-items-center">
        <section className="login-enter grid min-h-[calc(100vh-24px)] w-full max-w-[1680px] overflow-hidden rounded-[34px] border border-white/15 bg-navy-950/45 shadow-2xl shadow-black/35 lg:grid-cols-[minmax(0,1.32fr)_minmax(390px,0.68fr)]">
          <aside
            className="relative hidden min-h-[720px] overflow-hidden lg:block"
            style={{ backgroundImage: `url("${INSTITUTIONAL_ASSETS.hero}")`, backgroundPosition: 'center', backgroundSize: 'cover' }}
          >
            <div className="absolute inset-0 bg-[#040F28]/70" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#061B42]/98 via-[#0B2D6B]/72 to-[#123D8A]/42" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#040F28]/95 via-[#040F28]/28 to-transparent" />

            <div className="relative z-10 flex h-full min-h-[720px] flex-col justify-between p-10 xl:p-12">
              <div className="login-rise">
                <div className="login-logo-frame w-48">
                  <img className="h-auto w-full" src={BRAND.loginLogo} alt={BRAND.consortiumName} />
                </div>

                <div className="mt-10 max-w-3xl">
                  <p className="text-xs font-black uppercase tracking-[.36em] text-[#17B33A]">Vila Velha • Espírito Santo</p>
                  <h1 className="mt-3 text-5xl font-black leading-tight xl:text-6xl">
                    <span className="text-white">{LOGIN_COPY.titlePrefix}</span>{' '}
                    <span className="login-title-shimmer">{LOGIN_COPY.titleHighlight}</span>
                  </h1>
                  <p className="mt-4 max-w-3xl text-2xl font-black leading-9 text-white xl:text-[1.75rem]">{LOGIN_COPY.subtitle}</p>
                  <div className="login-status-pill mt-4 inline-flex items-center gap-2 rounded-full border border-green-300/25 bg-green-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-green-100 backdrop-blur-md">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="login-pulse absolute inline-flex h-full w-full rounded-full bg-[#17B33A] opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#17B33A]" />
                    </span>
                    Plataforma Operacional Ativa
                  </div>
                  <p className="mt-5 max-w-2xl text-base font-bold leading-7 text-slate-100">{LOGIN_COPY.description}</p>
                </div>

                <div className="mt-8 grid max-w-3xl gap-x-8 gap-y-3 sm:grid-cols-2">
                  {INDICATORS.map((item) => (
                    <span key={item} className="inline-flex items-center gap-2 text-sm font-black text-white/95 drop-shadow">
                      <CheckCircle2 size={18} className="shrink-0 text-[#17B33A]" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <InstitutionalFooter />
            </div>
          </aside>

          <main className="grid place-items-center p-4 md:p-8">
            <form className="login-rise glass-card w-full max-w-lg rounded-[30px] border-white/20 p-7 shadow-2xl shadow-black/25 md:p-9" onSubmit={handleSubmit}>
              <div className="text-center">
                <div className="mx-auto mb-6 grid max-w-[220px] justify-items-center lg:hidden">
                  <img className="h-auto w-36" src={BRAND.loginLogo} alt={BRAND.consortiumName} />
                  <p className="mt-5 text-xs font-black uppercase tracking-[0.24em] text-blue-200">SIGEBAP Mobile</p>
                  <h1 className="mt-2 text-3xl font-black leading-tight text-white">Operação em Campo</h1>
                </div>
                <p className="hidden text-xs font-black uppercase tracking-[0.28em] text-blue-200 lg:block">Acesso operacional</p>
                <h2 className="mt-3 hidden text-4xl font-black leading-tight text-white lg:block">{LOGIN_COPY.title}</h2>
                <p className="mt-2 hidden text-base font-black leading-6 text-slate-200 lg:block">{LOGIN_COPY.subtitle}</p>
                <div className="mt-2 lg:mt-6">
                  <p className="text-2xl font-black text-white">Bem-vindo</p>
                  <p className="mt-1 text-sm font-semibold text-slate-300">Acesse a plataforma operacional</p>
                </div>
              </div>

              <div className="mt-8 grid gap-4">
                <label className="field-label">
                  <span className="flex items-center gap-2">
                    <User size={18} />
                    Usuário
                  </span>
                  <input
                    className="form-control"
                    value={form.usuario}
                    onChange={(event) => setForm((current) => ({ ...current, usuario: event.target.value }))}
                    autoComplete="username"
                  />
                </label>

                <label className="field-label">
                  <span className="flex items-center gap-2">
                    <Lock size={18} />
                    Senha
                  </span>
                  <input
                    className="form-control"
                    type="password"
                    value={form.senha}
                    onChange={(event) => setForm((current) => ({ ...current, senha: event.target.value }))}
                    autoComplete="current-password"
                  />
                </label>
              </div>

              {error && <div className="mt-5 rounded-2xl border border-red-300/30 bg-red-500/15 p-3 text-sm font-bold text-red-100">{error}</div>}

              <button className="primary-button login-submit mt-7 w-full" type="submit" disabled={loading}>
                <LogIn size={18} />
                {loading ? 'Validando...' : 'Entrar'}
              </button>

              <button className="secondary-button mt-3 w-full" type="button" onClick={() => setAccessOpen(true)}>
                <UserPlus size={18} />
                Solicitar Acesso Técnico
              </button>

              <footer className="mt-6 border-t border-white/10 pt-5 text-center lg:hidden">
                <InstitutionalFooter compact />
              </footer>

              <div className="mt-6 grid gap-1 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-100/65">
                <span>Versão {LOGIN_COPY.version}</span>
                <span>Ambiente: Produção</span>
                <span>Última atualização: Junho/2026</span>
              </div>
            </form>
          </main>
        </section>
      </div>

      <Modal open={accessOpen} title="Primeiro Acesso - Técnicos" onClose={() => setAccessOpen(false)}>
        <form className="grid gap-4" onSubmit={handleSolicitarAcesso}>
          <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/60 p-4 text-sm font-semibold text-slate-200">
            O cadastro cria um usuário técnico pendente. O acesso só será liberado após aprovação do Supervisor da área.
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="field-label md:col-span-2">
              Nome Completo
              <input className="form-control" value={accessForm.nome} onChange={(event) => setAccessForm((current) => ({ ...current, nome: event.target.value }))} required />
            </label>
            <label className="field-label">
              Login
              <input className="form-control" value={accessForm.usuario} onChange={(event) => setAccessForm((current) => ({ ...current, usuario: event.target.value }))} required />
            </label>
            <label className="field-label">
              Equipe
              <select className="form-control" value={accessForm.equipe} onChange={(event) => setAccessForm((current) => ({ ...current, equipe: event.target.value }))} required>
                <option value="">Selecione...</option>
                {EQUIPES_TECNICAS.map((equipe) => (
                  <option key={equipe.value} value={equipe.value}>{equipe.label}</option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Senha
              <input className="form-control" type="password" value={accessForm.senha} onChange={(event) => setAccessForm((current) => ({ ...current, senha: event.target.value }))} required />
            </label>
            <label className="field-label">
              Confirmar Senha
              <input className="form-control" type="password" value={accessForm.confirmarSenha} onChange={(event) => setAccessForm((current) => ({ ...current, confirmarSenha: event.target.value }))} required />
            </label>
          </div>

          {accessMessage && (
            <div className={`rounded-2xl border p-3 text-sm font-bold ${accessMessage.includes('enviada') ? 'border-green-300/30 bg-green-500/15 text-green-100' : 'border-red-300/30 bg-red-500/15 text-red-100'}`}>
              {accessMessage}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button className="secondary-button" type="button" onClick={() => setAccessOpen(false)}>Fechar</button>
            <button className="primary-button" type="submit" disabled={accessLoading}>
              <UserPlus size={17} />
              {accessLoading ? 'Enviando...' : 'Enviar solicitação'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function InstitutionalFooter({ compact = false }) {
  const items = [
    {
      label: 'Prefeitura Municipal de Vila Velha',
      src: INSTITUTIONAL_ASSETS.prefeitura,
      imageClass: 'object-contain'
    },
    {
      label: 'Bandeira de Vila Velha',
      src: INSTITUTIONAL_ASSETS.vilaVelhaFlag,
      imageClass: 'object-cover'
    },
    {
      label: 'Estado do Espírito Santo',
      src: INSTITUTIONAL_ASSETS.espiritoSantoFlag,
      imageClass: 'object-cover'
    }
  ];

  const logoClass = compact ? 'h-14 w-24' : 'h-20 w-32';

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-5 py-4 shadow-lg shadow-black/10 backdrop-blur-md">
      <div className="grid grid-cols-3 items-center gap-4">
        {items.map((item) => (
          <div key={item.label} className="grid justify-items-center">
            <img className={`${logoClass} rounded-xl ${item.imageClass} drop-shadow-lg`} src={item.src} alt={item.label} />
          </div>
        ))}
      </div>
    </div>
  );
}
