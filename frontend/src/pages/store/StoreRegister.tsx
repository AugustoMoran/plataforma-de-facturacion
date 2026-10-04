import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useStore } from 'react-redux';
import { SEO } from '../../components/ecommerce/SEO';
import { usePublicRegisterMutation } from '../../services/authApi';
import { setCredentials } from '../../store/authSlice';
import { RootState } from '../../store';
import { syncCustomerCartWithServer } from '../../utils/syncCustomerCart';
import { useGetProvincesQuery } from '../../services/shippingApi';

const brandLogo = '/brand-logo.png';

export const StoreRegister: React.FC = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    street: '',
    city: '',
    province: '',
    postalCode: '',
    marketingOptIn: false,
  });
  const [error, setError] = useState('');
  const [publicRegister, { isLoading }] = usePublicRegisterMutation();
  const { data: provinces = [] } = useGetProvincesQuery();
  const dispatch = useDispatch();
  const store = useStore<RootState>();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const result = await publicRegister({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        marketingOptIn: form.marketingOptIn,
        shippingAddress: {
          street: form.street.trim(),
          city: form.city.trim(),
          province: form.province.trim(),
          postalCode: form.postalCode.trim(),
          country: 'AR',
        },
      }).unwrap();

      dispatch(setCredentials({ user: result.user }));
      await syncCustomerCartWithServer(store).catch(() => {});
      navigate(
        `/account?welcome=1&mail=${result.verificationEmailSent ? '1' : '0'}`
      );
    } catch (err: any) {
      setError(err?.data?.message || 'Error al crear la cuenta');
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center animate-slide-up py-8">
      <SEO title="Crear cuenta" description="Registrate para comprar en la tienda" />

      <div className="w-full max-w-lg">
        <div className="glass rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-white/90 mx-auto mb-4 flex items-center justify-center shadow-glow-md ring-1 ring-white/30 overflow-hidden">
              <img src={brandLogo} alt="Logo" className="w-10 h-10 object-contain" />
            </div>
            <h1 className="text-xl font-bold text-white">Crear cuenta</h1>
            <p className="text-sm text-slate-500 mt-1">Comprá online y guardá tu dirección de envío</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm">{error}</div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="section-heading">Nombre completo</label>
                <input className="input" required value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="section-heading">Email</label>
                <input type="email" className="input" required value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="section-heading">Teléfono</label>
                <input className="input" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="section-heading">Contraseña</label>
                <input type="password" className="input" required minLength={8} value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
            </div>

            <div className="rounded-xl border border-blue-200/30 bg-white/5 p-4 space-y-3">
              <p className="text-sm font-semibold text-white">Dirección de envío</p>
              <input className="input" required placeholder="Calle y número" value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input className="input" required placeholder="Ciudad" value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })} />
                <select className="input" required value={form.province}
                  onChange={(e) => setForm({ ...form, province: e.target.value })}>
                  <option value="">Provincia</option>
                  {provinces.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <input className="input" required inputMode="numeric" maxLength={4} placeholder="CP (4 dígitos)"
                value={form.postalCode}
                onChange={(e) => setForm({ ...form, postalCode: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
            </div>

            <label className="flex items-start gap-2 text-xs text-blue-100/90">
              <input type="checkbox" checked={form.marketingOptIn}
                onChange={(e) => setForm({ ...form, marketingOptIn: e.target.checked })} />
              Quiero recibir novedades y ofertas por email
            </label>

            <button type="submit" disabled={isLoading} className="btn-primary w-full mt-2">
              {isLoading ? 'Creando cuenta...' : 'Registrarse'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            ¿Ya tenés cuenta? <Link to="/login" className="text-brand-400 hover:text-brand-300">Ingresá</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
