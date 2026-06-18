import { useState } from 'react';
import { Lock, LogIn, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loginWithUsuarioSenha } from '../services/authService.js';
import { START_ROUTE_BY_ROLE } from '../config/permissions.js';
import { BRAND } from '../config/brand.js';
import { useAuthStore } from '../store/authStore.js';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((state) => state.setSession);
  const [form, setForm] = useState({ usuario: '', senha: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await loginWithUsuarioSenha(form.usuario, form.senha);
      setSession(user);
      const destination = location.state?.from?.pathname || START_ROUTE_BY_ROLE[user.perfil] || '/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message || 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-bg">
      <div className="content-layer grid place-items-center">
        <section className="grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_.95fr]">
          <div className="hidden text-center lg:block">
            <div className="login-logo-frame mx-auto mb-6 w-72">
              <img className="h-auto w-full" src={BRAND.loginLogo} alt={BRAND.consortiumName} />
            </div>
            <p className="text-xs font-black uppercase tracking-[.32em] text-[#17B33A]">EBAPs Vila Velha</p>
            <h1 className="mt-2 text-4xl font-black tracking-wide text-white">{BRAND.systemName}</h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg font-bold leading-8 text-slate-200">{BRAND.consortiumName}</p>
          </div>

          <form className="glass-card mx-auto w-full max-w-xl rounded-[26px] p-6 md:p-10" onSubmit={handleSubmit}>
            <div className="text-center">
              <div className="login-logo-frame mx-auto mb-5 w-[190px] max-w-full">
                <img className="h-auto w-full" src={BRAND.loginLogo} alt={BRAND.consortiumName} />
              </div>
              <p className="text-xl font-black text-white">{BRAND.systemName}</p>
              <p className="mt-1 text-sm font-extrabold text-[#17B33A]">{BRAND.consortiumName}</p>
              <h2 className="mt-6 text-3xl font-black text-white md:text-4xl">Entrar</h2>
              <p className="mt-2 text-sm text-slate-300">Acesso interno por usuário e senha.</p>
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
                  placeholder="admin"
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
                  placeholder="••••••••"
                />
              </label>
            </div>

            {error && <div className="mt-5 rounded-2xl border border-red-300/30 bg-red-500/15 p-3 text-sm font-bold text-red-100">{error}</div>}

            <button className="primary-button mt-6 w-full" type="submit" disabled={loading}>
              <LogIn size={18} />
              {loading ? 'Validando...' : 'Entrar'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
