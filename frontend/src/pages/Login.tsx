import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useLoginMutation } from '../services/authApi';
import { setCredentials } from '../store/authSlice';
import { useStore } from 'react-redux';
import { RootState } from '../store';
import { syncCustomerCartWithServer } from '../utils/syncCustomerCart';

const brandLogo = '/brand-logo.png';

type LoginVariant = 'store' | 'staff';

const mapLoginError = (message?: string) => {
  if (!message) return 'Error al iniciar sesión. Verificá email y contraseña.';
  if (message === 'Invalid credentials') {
    return 'Email o contraseña incorrectos. Si cambiaste tu email en Mi cuenta, usá el nuevo.';
  }
  return message;
};

export const Login: React.FC<{ variant?: LoginVariant }> = ({ variant = 'staff' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const store = useStore<RootState>();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isStore = variant === 'store';
  const redirectAfter = params.get('from') || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const normalizedEmail = email.trim().toLowerCase();

      const result = await login({
        email: normalizedEmail,
        password,
      }).unwrap();
      dispatch(setCredentials({ user: result.user }));
      await syncCustomerCartWithServer(store).catch(() => {});
      const roles: string[] = result?.user?.roles || [];
      const isStaff = roles.some((r) => ['admin', 'vendedor'].includes(String(r).toLowerCase()));

      if (isStaff) {
        navigate('/dashboard');
        return;
      }

      if (redirectAfter && redirectAfter.startsWith('/') && !redirectAfter.startsWith('/dashboard')) {
        navigate(redirectAfter);
        return;
      }
      navigate('/');
    } catch (err: any) {
      setError(mapLoginError(err.data?.message));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] relative overflow-hidden px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-brand-900/20 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-900/20 rounded-full blur-[160px]" />
      </div>

      <div className="w-full max-w-sm relative z-10 animate-slide-up">
        <div className="glass rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-white/90 mx-auto mb-4 flex items-center justify-center shadow-glow-md ring-1 ring-white/30 overflow-hidden">
              <img src={brandLogo} alt="Logo" className="w-10 h-10 object-contain" />
            </div>
            <h1 className="text-xl font-bold text-white">Oso Sound</h1>
            <p className="text-sm text-slate-500 mt-1">
              {isStore ? 'Ingresá a tu cuenta de la tienda' : 'Panel de gestión profesional'}
            </p>
          </div>

          {isStore && (
            <p className="text-xs text-slate-400 mb-4 text-center leading-relaxed">
              Usá el mismo email y contraseña con los que te registraste en{' '}
              <Link to="/register" className="text-brand-400 hover:text-brand-300">/register</Link>.
              Si actualizaste el email en Mi cuenta, ingresá con el nuevo.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            )}

            <div>
              <label className="section-heading">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder={isStore ? 'tu@email.com' : 'admin@empresa.com'}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="section-heading">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full mt-2">
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Iniciando...
                </span>
              ) : 'Iniciar sesión'}
            </button>
          </form>

          <div className="text-center text-sm text-slate-600 mt-6 space-y-2">
            {isStore ? (
              <>
                <p>
                  ¿No tenés cuenta?{' '}
                  <Link to="/register" className="text-brand-400 hover:text-brand-300 transition-colors">
                    Registrarse
                  </Link>
                </p>
                <p>
                  ¿Sos del equipo?{' '}
                  <Link to="/login" className="text-brand-400 hover:text-brand-300 transition-colors">
                    Acceso al panel
                  </Link>
                </p>
              </>
            ) : (
              <>
                <p>
                  ¿Sos cliente de la tienda?{' '}
                  <Link to="/ingresar" className="text-brand-400 hover:text-brand-300 transition-colors">
                    Ingresá acá
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
