import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SEO } from '../../components/ecommerce/SEO';
import { useGetStoreOrderQuery } from '../../services/ecommerceApi';
import { useLazySyncPaywaySaleStatusQuery } from '../../services/paymentsApi';
import { useTrackEventMutation } from '../../services/analyticsApi';

const paymentStatusLabel: Record<string, string> = {
  approved: 'Pago confirmado',
  pending: 'Pago pendiente',
  rejected: 'Pago rechazado',
};

export const StoreCheckoutConfirmation: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: order, isLoading, isError, refetch } = useGetStoreOrderQuery(orderId || '', { skip: !orderId });
  const [syncPaywayStatus] = useLazySyncPaywaySaleStatusQuery();
  const [trackEvent] = useTrackEventMutation();
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    trackEvent({ event: 'order_confirmation', metadata: { orderId } }).catch(() => {});

    syncPaywayStatus(orderId)
      .unwrap()
      .then((result) => {
        if (result.paymentStatus) {
          setPaymentStatus(result.paymentStatus);
        }
        refetch();
      })
      .catch((error: any) => {
        const status = error?.data?.paymentStatus;
        if (status) setPaymentStatus(status);
        if (error?.data?.message) setSyncMessage(error.data.message);
      });
  }, [orderId, trackEvent, syncPaywayStatus, refetch]);

  if (isLoading) {
    return <div className="text-blue-100/90 text-sm py-20 text-center">Cargando confirmación...</div>;
  }

  if (isError || !order) {
    return (
      <div className="card p-12 text-center space-y-4 max-w-lg mx-auto">
        <p className="text-blue-800">No se pudo cargar la confirmación del pedido.</p>
        <Link to="/" className="btn-primary inline-flex">Volver al inicio</Link>
      </div>
    );
  }

  const resolvedStatus = order.paymentStatus || paymentStatus;
  const isApproved = resolvedStatus === 'approved';
  const isRejected = resolvedStatus === 'rejected';

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-slide-up text-center">
      <SEO
        title={isApproved ? 'Pago confirmado' : 'Pedido registrado'}
        description="Estado de tu pedido en Oso Sound Music"
      />

      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
        isRejected ? 'bg-red-500/20' : isApproved ? 'bg-emerald-500/20' : 'bg-amber-500/20'
      }`}>
        <svg
          className={`w-8 h-8 ${isRejected ? 'text-red-400' : isApproved ? 'text-emerald-400' : 'text-amber-300'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isRejected ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          )}
        </svg>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">
          {isApproved ? '¡Pago confirmado!' : isRejected ? 'Pago no aprobado' : 'Pedido registrado'}
        </h1>
        <p className="text-blue-100/90 mt-2">
          {isApproved
            ? 'Recibimos tu pago y ya estamos preparando tu pedido.'
            : isRejected
              ? 'El pago no se completó. Podés volver al checkout e intentar nuevamente.'
              : 'Tu pedido quedó registrado. Si el pago sigue pendiente, lo confirmaremos en breve.'}
        </p>
        {syncMessage && !isApproved && (
          <p className="text-blue-200/70 text-sm mt-2">{syncMessage}</p>
        )}
      </div>

      <div className="card p-6 text-left space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Nº de pedido</span>
          <span className="font-mono text-brand-400">{order.orderNumber || order._id?.slice(-8).toUpperCase()}</span>
        </div>
        {order.customerName && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Cliente</span>
            <span className="text-white">{order.customerName}</span>
          </div>
        )}
        {order.total != null && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Total</span>
            <span className="font-bold text-white tabular-nums">
              ${Number(order.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Estado del pago</span>
          <span className={`capitalize ${isApproved ? 'text-emerald-400' : isRejected ? 'text-red-400' : 'text-amber-300'}`}>
            {paymentStatusLabel[resolvedStatus] || resolvedStatus}
          </span>
        </div>
        {order.status && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Estado del pedido</span>
            <span className="badge-blue capitalize">{order.status}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {isRejected ? (
          <Link to="/checkout" className="btn-primary">Volver al checkout</Link>
        ) : (
          <Link to="/" className="btn-primary">Volver al inicio</Link>
        )}
        <Link to="/products" className="btn-secondary">Seguir comprando</Link>
      </div>
    </div>
  );
};
