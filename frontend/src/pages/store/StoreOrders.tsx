import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/ecommerce/SEO';
import { StoreAuthRoute } from '../../components/ecommerce/RouteGuards';
import { useGetMyStoreOrdersQuery } from '../../services/ecommerceApi';

const statusLabel: Record<string, string> = {
  approved: 'Pago confirmado',
  pending: 'Pago pendiente',
  rejected: 'Pago rechazado',
};

export const StoreOrders: React.FC = () => {
  const { data: orders = [], isLoading } = useGetMyStoreOrdersQuery();

  return (
    <StoreAuthRoute>
      <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
        <SEO title="Mis pedidos" description="Historial de compras" />
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="page-title">Mis pedidos</h1>
            <p className="page-sub">Seguimiento de tus compras en la tienda</p>
          </div>
          <Link to="/account" className="btn-secondary text-xs">Mi cuenta</Link>
        </div>

        {isLoading ? (
          <p className="text-blue-100/80 text-sm">Cargando pedidos...</p>
        ) : orders.length === 0 ? (
          <div className="card p-8 text-center text-sm text-blue-100/80">
            Todavía no tenés pedidos. <Link to="/products" className="text-brand-400">Ver productos</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order: any) => (
              <Link key={order._id} to={`/checkout/confirmation/${order._id}`}
                className="card p-4 block hover:border-brand-300/40 transition-colors">
                <div className="flex justify-between gap-3 text-sm">
                  <div>
                    <p className="font-semibold text-white">{order.invoiceNumber || order._id.slice(-8).toUpperCase()}</p>
                    <p className="text-blue-200/70 text-xs">{new Date(order.createdAt).toLocaleString('es-AR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white tabular-nums">
                      ${Number(order.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-blue-200/80 capitalize">
                      {statusLabel[order.paymentStatus] || order.paymentStatus || '—'}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </StoreAuthRoute>
  );
};
