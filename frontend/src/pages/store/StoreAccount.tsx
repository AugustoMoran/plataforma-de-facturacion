import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { SEO } from '../../components/ecommerce/SEO';
import { RootState } from '../../store';
import { StoreAuthRoute, isCustomerRole } from '../../components/ecommerce/RouteGuards';
import {
  useChangeCustomerEmailMutation,
  useResendVerificationMutation,
  useUpdateProfileMutation,
} from '../../services/authApi';
import { setUser } from '../../store/authSlice';
import { useGetProvincesQuery } from '../../services/shippingApi';
import { isInstitutionalEmail } from '../../utils/emailDeliverability';
import { useStoreLogout } from '../../hooks/useStoreLogout';

export const StoreAccount: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const [params] = useSearchParams();
  const { data: provinces = [] } = useGetProvincesQuery();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const [resendVerification, { isLoading: resending }] = useResendVerificationMutation();
  const [changeCustomerEmail, { isLoading: changingEmail }] = useChangeCustomerEmailMutation();
  const { logout, isLoggingOut } = useStoreLogout();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const institutionalEmail = useMemo(
    () => (user?.email ? isInstitutionalEmail(user.email) : false),
    [user?.email]
  );

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    street: user?.defaultShippingAddress?.street || '',
    city: user?.defaultShippingAddress?.city || '',
    province: user?.defaultShippingAddress?.province || '',
    postalCode: user?.defaultShippingAddress?.postalCode || '',
    marketingOptIn: Boolean(user?.marketingOptIn),
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || '',
      phone: user.phone || '',
      street: user.defaultShippingAddress?.street || '',
      city: user.defaultShippingAddress?.city || '',
      province: user.defaultShippingAddress?.province || '',
      postalCode: user.defaultShippingAddress?.postalCode || '',
      marketingOptIn: Boolean(user.marketingOptIn),
    });
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const updated = await updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
        marketingOptIn: form.marketingOptIn,
        defaultShippingAddress: {
          street: form.street.trim(),
          city: form.city.trim(),
          province: form.province.trim(),
          postalCode: form.postalCode.trim(),
          country: 'AR',
        },
      }).unwrap();
      dispatch(setUser(updated));
      setMessage('Datos actualizados.');
    } catch (err: any) {
      setError(err?.data?.message || 'No se pudieron guardar los datos');
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) {
      setError('Ingresá un email nuevo.');
      return;
    }
    if (isInstitutionalEmail(trimmed)) {
      setError('Ese dominio también suele bloquear correos. Usá Gmail, Outlook u otro email personal.');
      return;
    }
    try {
      const result = await changeCustomerEmail({ newEmail: trimmed }).unwrap();
      dispatch(setUser(result.user));
      setNewEmail('');
      setMessage(
        result.verificationEmailSent
          ? `Actualizamos tu email a ${result.user.email}. Revisá la bandeja (y spam) para confirmar.`
          : `Email actualizado a ${result.user.email}, pero no pudimos enviar el correo. Probá reenviar en unos minutos.`
      );
    } catch (err: any) {
      setError(err?.data?.message || 'No se pudo cambiar el email');
    }
  };

  const handleResend = async () => {
    setMessage('');
    setError('');
    try {
      const result = await resendVerification().unwrap();
      if (result.alreadyVerified) {
        setMessage('Tu email ya está verificado.');
        return;
      }
      if (result.mailSent) {
        setMessage(
          `Enviamos el correo de verificación a ${result.sentTo || user?.email}. Revisá bandeja y spam.`
        );
      }
    } catch (err: any) {
      const data = err?.data;
      if (data?.code === 'EMAIL_INSTITUTIONAL') {
        setError(data.message);
        return;
      }
      setError(data?.message || 'No se pudo reenviar la verificación');
    }
  };

  const showInstitutionalBlock =
    user && isCustomerRole(user.roles) && !user.emailVerified && institutionalEmail;

  return (
    <StoreAuthRoute>
      <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
        <SEO title="Mi cuenta" description="Perfil de cliente Oso Sound Music" />

        <div>
          <h1 className="page-title">Mi cuenta</h1>
          <p className="page-sub">{user?.email}</p>
        </div>

        {params.get('welcome') === '1' && (
          <div className="rounded-xl border border-brand-300/40 bg-brand-500/10 p-4 text-sm text-blue-100">
            {params.get('mail') === '1'
              ? 'Cuenta creada. Te enviamos un enlace para confirmar tu email (revisá spam si no lo ves).'
              : 'Cuenta creada. Si usaste un correo institucional (@edu.ar), cambiá a un email personal abajo para poder verificar.'}
          </div>
        )}

        {showInstitutionalBlock && (
          <div className="rounded-xl border border-red-300/40 bg-red-500/10 p-4 text-sm text-red-50 space-y-3">
            <p>
              Tu email <strong>{user?.email}</strong> es institucional y suele <strong>bloquear</strong> nuestros
              correos de verificación. No podemos confirmarlo ahí.
            </p>
            <p>Ingresá un email personal (Gmail, Outlook, etc.). Te enviaremos el enlace de verificación a esa casilla.</p>
            <form onSubmit={handleChangeEmail} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                className="input flex-1"
                placeholder="tu@gmail.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
              <button type="submit" className="btn-primary !py-2 !px-4 text-xs shrink-0" disabled={changingEmail}>
                {changingEmail ? 'Guardando...' : 'Cambiar y enviar verificación'}
              </button>
            </form>
          </div>
        )}

        {user && isCustomerRole(user.roles) && !user.emailVerified && !institutionalEmail && (
          <div className="rounded-xl border border-amber-300/40 bg-amber-500/10 p-4 text-sm text-amber-100 space-y-3">
            <p>Tu email aún no está verificado. Confirmalo desde el enlace que te enviamos por correo.</p>
            <button
              type="button"
              className="btn-secondary !py-2 !px-3 text-xs"
              disabled={resending}
              onClick={handleResend}
            >
              {resending ? 'Enviando...' : 'Reenviar email de verificación'}
            </button>
          </div>
        )}

        {message ? <div className="text-sm text-emerald-300">{message}</div> : null}
        {error ? <div className="text-sm text-red-300">{error}</div> : null}

        <form onSubmit={handleSave} className="card p-6 space-y-4">
          <div>
            <label className="section-heading">Nombre</label>
            <input className="input" required value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="section-heading">Teléfono</label>
            <input className="input" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-y-3">
            <p className="section-heading">Dirección de envío guardada</p>
            <input className="input" required value={form.street}
              onChange={(e) => setForm({ ...form, street: e.target.value })} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className="input" required value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <select className="input" required value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}>
                <option value="">Provincia</option>
                {provinces.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <input className="input" required maxLength={4} value={form.postalCode}
              onChange={(e) => setForm({ ...form, postalCode: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-blue-100">
            <input type="checkbox" checked={form.marketingOptIn}
              onChange={(e) => setForm({ ...form, marketingOptIn: e.target.checked })} />
            Recibir novedades por email
          </label>
          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>

        <div className="flex flex-wrap gap-3">
          <Link to="/account/orders" className="btn-secondary">Mis pedidos</Link>
          <Link to="/products" className="btn-secondary">Seguir comprando</Link>
          <button
            type="button"
            className="btn-secondary text-red-200 border-red-300/30 hover:bg-red-500/10"
            disabled={isLoggingOut}
            onClick={() => logout()}
          >
            {isLoggingOut ? 'Saliendo...' : 'Cerrar sesión'}
          </button>
        </div>
      </div>
    </StoreAuthRoute>
  );
};
