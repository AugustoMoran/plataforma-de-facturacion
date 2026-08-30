import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SEO } from '../../components/ecommerce/SEO';

export const StoreCheckoutFailure: React.FC = () => {
  const [params] = useSearchParams();
  const saleId = params.get('saleId');

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-slide-up text-center">
      <SEO title="Pago cancelado" description="El pago no se completó" />

      <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">Pago no completado</h1>
        <p className="text-blue-100/90 mt-2">
          El pago fue cancelado o no pudo procesarse. Podés intentar nuevamente o contactarnos por WhatsApp.
        </p>
      </div>

      {saleId && (
        <p className="text-xs text-blue-200/80 font-mono">Referencia: {saleId}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/checkout" className="btn-primary">Reintentar pago</Link>
        <Link to="/products" className="btn-secondary">Volver al catálogo</Link>
      </div>
    </div>
  );
};
