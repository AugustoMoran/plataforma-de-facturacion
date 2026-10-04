import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useGetRegisterSetupQuery, useRegisterMutation } from '../services/authApi';

const brandLogo = '/brand-logo.png';

/** Primera instalación: único administrador del panel (ruta `/setup`). */
export const AdminSetup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { data: setup, isLoading: setupLoading } = useGetRegisterSetupQuery();
  const [register, { isLoading }] = useRegisterMutation();
  const navigate = useNavigate();

  const staffBootstrapOpen = setup?.staffBootstrapOpen ?? false;
  const closedPanel = !setupLoading && !staffBootstrapOpen;

  if (closedPanel) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register({
        email: email.trim().toLowerCase(),
        password: password.trim(),
        roles: ['admin'],
      }).unwrap();
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      const message = err?.data?.message as string | undefined;
      const code = err?.data?.code as string | undefined;
      if (err?.status === 403 || code === 'STAFF_REGISTRATION_CLOSED') {
        setError(message || 'El panel ya está configurado.');
        return;
      }
      setError(message || 'Error al registrar usuario.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] relative overflow-hidden px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-900/15 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-brand-900/20 rounded-full blur-[160px]" />
      </div>

      <div className="w-full max-w-sm relative z-10 animate-slide-up">
        <div className="glass rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-white/90 mx-auto mb-4 flex items-center justify-center shadow-glow-md ring-1 ring-white/30 overflow-hidden">
              <img src={brandLogo} alt="Logo" className="w-10 h-10 object-contain" />
            </div>
            <h1 className="text-xl font-bold text-white">Configuración inicial</h1>
            <p className="text-sm text-slate-500 mt-1">Crear el primer administrador del panel</p>
          </div>

          {setupLoading ? (
            <p className="text-center text-sm text-slate-500 py-6">Cargando...</p>
          ) : success ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white font-semibold">Administrador creado</p>
              <p className="text-sm text-slate-500">Redirigiendo al login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="section-heading">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="input" placeholder="admin@empresa.com" required />
              </div>

              <div>
                <label className="section-heading">Contraseña</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="input" placeholder="••••••••" required minLength={8} />
              </div>

              <button type="submit" disabled={isLoading} className="btn-primary w-full mt-2">
                {isLoading ? 'Creando...' : 'Crear administrador'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-slate-600 mt-6">
            <Link to="/login" className="text-brand-400 hover:text-brand-300 transition-colors">Ir al login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
