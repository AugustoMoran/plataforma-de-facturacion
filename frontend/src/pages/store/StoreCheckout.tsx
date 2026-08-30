import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { SEO } from '../../components/ecommerce/SEO';
import { selectCartItems, selectCartTotal, clearCart, CartItem } from '../../store/cartSlice';
import { useCreateStoreOrderMutation } from '../../services/ecommerceApi';
import { useGetPaywayConfigQuery, useCreatePaywayCheckoutMutation } from '../../services/paymentsApi';
import { useTrackEventMutation } from '../../services/analyticsApi';
import { buildWhatsAppQuickOrderUrl } from '../../utils/whatsappOrderMessage';

type PaymentChoice = 'payway' | 'whatsapp';
type CheckoutStep = 'method' | 'details';

const OrderSummary: React.FC<{
  items: CartItem[];
  total: number;
  hint?: string;
}> = ({ items, total, hint }) => (
  <div className="card p-6 space-y-4 h-fit">
    <h2 className="text-sm font-semibold text-blue-950">Resumen</h2>
    <div className="space-y-3 max-h-64 overflow-y-auto">
      {items.map((item) => (
        <div key={item.productId} className="flex justify-between gap-2 text-sm">
          <span className="text-blue-800 truncate">{item.name} × {item.quantity}</span>
          <span className="text-blue-950 font-medium tabular-nums flex-shrink-0">
            ${(item.price * item.quantity).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      ))}
    </div>
    <div className="border-t border-blue-100 pt-4 flex justify-between font-bold text-lg">
      <span className="text-blue-950">Total</span>
      <span className="text-brand-600 tabular-nums">
        ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
      </span>
    </div>
    {hint && <p className="text-xs text-blue-700">{hint}</p>}
    <Link to="/products" className="text-xs text-blue-700 hover:text-brand-600 transition-colors block text-center">
      Seguir comprando
    </Link>
  </div>
);

const PaymentMethodCard: React.FC<{
  selected: boolean;
  onSelect: () => void;
  title: string;
  subtitle: string;
  description: string;
  accent: 'payway' | 'wa';
  wide?: boolean;
}> = ({ selected, onSelect, title, subtitle, description, accent, wide }) => {
  const selectedStyles =
    accent === 'wa'
      ? 'border-emerald-400 bg-emerald-50 ring-1 ring-emerald-200'
      : 'border-brand-500/50 bg-brand-50 ring-1 ring-brand-200';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left rounded-xl border p-4 transition-all ${
        selected ? selectedStyles : 'border-blue-200 bg-blue-50/60 hover:border-blue-300 hover:bg-blue-50'
      } ${wide ? 'sm:col-span-2' : ''}`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            accent === 'wa' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'
          }`}
        >
          {accent === 'wa' ? (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.884 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.89-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-950">{title}</p>
          <p className="text-xs text-blue-700">{subtitle}</p>
        </div>
      </div>
      <p className="text-xs text-blue-800">{description}</p>
    </button>
  );
};

export const StoreCheckout: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const [createOrder, { isLoading: creatingOrder }] = useCreateStoreOrderMutation();
  const [createPaywayCheckout, { isLoading: creatingCheckout }] = useCreatePaywayCheckoutMutation();
  const { data: paywayConfig } = useGetPaywayConfigQuery();
  const [trackEvent] = useTrackEventMutation();

  const [step, setStep] = useState<CheckoutStep>('method');
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice | null>(null);
  const [paywayForm, setPaywayForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    street: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'Argentina',
    notes: '',
  });
  const [waForm, setWaForm] = useState({
    customerName: '',
    customerPhone: '',
    notes: '',
  });
  const [error, setError] = useState('');

  const isLoading = creatingOrder || creatingCheckout;
  const paywayEnabled = Boolean(paywayConfig?.enabled);

  useEffect(() => {
    trackEvent({ event: 'page_view', path: '/checkout' }).catch(() => {});
  }, [trackEvent]);

  useEffect(() => {
    if (items.length === 0) {
      navigate('/products');
    }
  }, [items.length, navigate]);

  useEffect(() => {
    if (!paywayEnabled) {
      setPaymentChoice('whatsapp');
    }
  }, [paywayEnabled]);

  const handleContinueFromMethod = () => {
    if (!paymentChoice) {
      setError('Elegí cómo querés pagar para continuar.');
      return;
    }
    setError('');
    setStep('details');
  };

  const handleWhatsAppCheckout = () => {
    const url = buildWhatsAppQuickOrderUrl(items, total, {
      customerName: waForm.customerName.trim(),
      customerPhone: waForm.customerPhone.trim(),
      notes: waForm.notes.trim() || undefined,
    });
    trackEvent({ event: 'whatsapp_checkout', metadata: { total, items: items.length } }).catch(() => {});
    dispatch(clearCart());
    window.open(url, '_blank', 'noopener,noreferrer');
    navigate('/checkout/consulta-enviada');
  };

  const handlePaywayCheckout = async () => {
    const order = await createOrder({
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      customerName: paywayForm.customerName.trim(),
      customerEmail: paywayForm.customerEmail.trim(),
      customerPhone: paywayForm.customerPhone.trim() || undefined,
      shippingAddress: {
        street: paywayForm.street.trim(),
        city: paywayForm.city.trim(),
        province: paywayForm.province.trim(),
        postalCode: paywayForm.postalCode.trim(),
        country: paywayForm.country.trim(),
      },
      notes: paywayForm.notes.trim() || undefined,
      paymentMethod: 'payway',
    }).unwrap();

    trackEvent({ event: 'purchase', metadata: { orderId: order._id, total } }).catch(() => {});

    const checkout = await createPaywayCheckout({
      saleId: order._id,
      payerEmail: paywayForm.customerEmail.trim(),
    }).unwrap();

    dispatch(clearCart());
    if (checkout.checkoutUrl) {
      window.location.href = checkout.checkoutUrl;
      return;
    }

    navigate(`/checkout/confirmation/${order._id}`);
  };

  const handleSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (paymentChoice === 'whatsapp') {
        handleWhatsAppCheckout();
        return;
      }

      if (!paywayEnabled) {
        setError('Payway no está disponible. Elegí consultar por WhatsApp.');
        return;
      }

      await handlePaywayCheckout();
    } catch (err: any) {
      setError(err?.data?.message || 'Error al procesar el pedido');
    }
  };

  if (items.length === 0) return null;

  const stepLabel = step === 'method' ? 'Paso 1 de 2' : 'Paso 2 de 2';
  const stepTitle = step === 'method' ? '¿Cómo querés pagar?' : paymentChoice === 'whatsapp'
    ? 'Datos para consultar por WhatsApp'
    : 'Datos para el pago';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
      <SEO title="Finalizar compra" description="Completá tu pedido de forma segura" />

      <div>
        <p className="text-xs uppercase tracking-wide text-brand-400 font-semibold mb-1">{stepLabel}</p>
        <h1 className="page-title">Finalizar compra</h1>
        <p className="page-sub">{stepTitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 card p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm">{error}</div>
          )}

          {step === 'method' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paywayEnabled && (
                  <PaymentMethodCard
                    selected={paymentChoice === 'payway'}
                    onSelect={() => setPaymentChoice('payway')}
                    title="Pagar con tarjeta"
                    subtitle="Payway — pago online seguro"
                    description="Completás tus datos, confirmás el pedido y pagás con tarjeta de crédito o débito."
                    accent="payway"
                  />
                )}
                <PaymentMethodCard
                  selected={paymentChoice === 'whatsapp'}
                  onSelect={() => setPaymentChoice('whatsapp')}
                  title="Consultar por WhatsApp"
                  subtitle="Coordinar con un asesor"
                  description="Enviás el pedido por WhatsApp. No reserva stock ni genera venta automática."
                  accent="wa"
                  wide={!paywayEnabled}
                />
              </div>

              <button type="button" onClick={handleContinueFromMethod} className="btn-primary w-full py-3">
                Continuar
              </button>
            </>
          )}

          {step === 'details' && paymentChoice === 'whatsapp' && (
            <form onSubmit={handleSubmitDetails} className="space-y-4">
              <button
                type="button"
                onClick={() => { setStep('method'); setError(''); }}
                className="text-xs text-blue-800 hover:text-brand-600 transition-colors"
              >
                ← Volver a elegir método
              </button>

              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-blue-900">
                Solo necesitamos tus datos básicos. Un asesor te contactará por WhatsApp para coordinar pago y envío.
              </div>

              <div>
                <label className="section-heading">Nombre completo</label>
                <input className="input" required value={waForm.customerName}
                  onChange={(e) => setWaForm({ ...waForm, customerName: e.target.value })} />
              </div>
              <div>
                <label className="section-heading">Teléfono / WhatsApp</label>
                <input className="input" required value={waForm.customerPhone}
                  onChange={(e) => setWaForm({ ...waForm, customerPhone: e.target.value })}
                  placeholder="Ej: 11 2880-2698" />
              </div>
              <div>
                <label className="section-heading">Consulta o notas (opcional)</label>
                <textarea className="input min-h-[90px]" value={waForm.notes}
                  onChange={(e) => setWaForm({ ...waForm, notes: e.target.value })}
                  placeholder="Ej: ¿Tienen envío a mi zona? ¿Hay stock disponible?" />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-semibold bg-[#25D366] hover:bg-[#20bd5a] text-white transition-colors"
              >
                Enviar pedido por WhatsApp
              </button>
            </form>
          )}

          {step === 'details' && paymentChoice === 'payway' && (
            <form onSubmit={handleSubmitDetails} className="space-y-4">
              <button
                type="button"
                onClick={() => { setStep('method'); setError(''); }}
                className="text-xs text-blue-800 hover:text-brand-600 transition-colors"
              >
                ← Volver a elegir método
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="section-heading">Nombre completo</label>
                  <input className="input" required value={paywayForm.customerName}
                    onChange={(e) => setPaywayForm({ ...paywayForm, customerName: e.target.value })} />
                </div>
                <div>
                  <label className="section-heading">Email</label>
                  <input className="input" type="email" required value={paywayForm.customerEmail}
                    onChange={(e) => setPaywayForm({ ...paywayForm, customerEmail: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="section-heading">Teléfono</label>
                <input className="input" value={paywayForm.customerPhone}
                  onChange={(e) => setPaywayForm({ ...paywayForm, customerPhone: e.target.value })} />
              </div>

              <div>
                <label className="section-heading">Dirección</label>
                <input className="input" required value={paywayForm.street}
                  onChange={(e) => setPaywayForm({ ...paywayForm, street: e.target.value })} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="section-heading">Ciudad</label>
                  <input className="input" required value={paywayForm.city}
                    onChange={(e) => setPaywayForm({ ...paywayForm, city: e.target.value })} />
                </div>
                <div>
                  <label className="section-heading">Provincia</label>
                  <input className="input" required value={paywayForm.province}
                    onChange={(e) => setPaywayForm({ ...paywayForm, province: e.target.value })} />
                </div>
                <div>
                  <label className="section-heading">Código postal</label>
                  <input className="input" required value={paywayForm.postalCode}
                    onChange={(e) => setPaywayForm({ ...paywayForm, postalCode: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="section-heading">Notas (opcional)</label>
                <textarea className="input min-h-[90px]" value={paywayForm.notes}
                  onChange={(e) => setPaywayForm({ ...paywayForm, notes: e.target.value })} />
              </div>

              <button type="submit" className="btn-primary w-full py-3" disabled={isLoading}>
                {isLoading ? 'Procesando...' : 'Ir a pagar con Payway'}
              </button>
            </form>
          )}
        </div>

        <div className="lg:col-span-2">
          <OrderSummary
            items={items}
            total={total}
            hint={
              step === 'details' && paymentChoice === 'payway'
                ? 'Serás redirigido al formulario seguro de Payway para completar el pago.'
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
};
