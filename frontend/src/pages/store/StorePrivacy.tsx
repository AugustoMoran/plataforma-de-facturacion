import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/ecommerce/SEO';

export const StorePrivacy: React.FC = () => (
  <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
    <SEO
      title="Política de privacidad"
      description="Política de privacidad de Oso Sound Music"
    />

    <div>
      <h1 className="page-title">Política de privacidad</h1>
      <p className="page-sub">Oso Sound Music — última actualización: {new Date().toLocaleDateString('es-AR')}</p>
    </div>

    <div className="card p-6 space-y-4 text-sm text-blue-900 leading-relaxed">
      <p>
        Oso Sound Music (&quot;nosotros&quot;) opera la tienda online y la aplicación móvil que permite acceder
        a nuestro sitio web. Esta política describe qué datos recopilamos y cómo los usamos.
      </p>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-blue-950">Datos que podemos recopilar</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Nombre, email y teléfono al realizar una compra o consulta.</li>
          <li>Dirección de envío cuando elegís entrega a domicilio.</li>
          <li>Datos de pago procesados por Payway (no almacenamos números de tarjeta).</li>
          <li>Información técnica básica (tipo de dispositivo, navegador) para mejorar el servicio.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-blue-950">Uso de la información</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Procesar pedidos, pagos y envíos.</li>
          <li>Comunicarnos sobre tu compra o consulta.</li>
          <li>Cumplir obligaciones legales y contables.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-blue-950">Compartir datos</h2>
        <p>
          Compartimos datos solo con proveedores necesarios para operar el servicio (pagos, envíos, hosting).
          No vendemos tus datos personales.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-blue-950">Contacto</h2>
        <p>
          Consultas sobre privacidad:{' '}
          <a href="mailto:musicaoesteventas@gmail.com" className="text-brand-600 hover:underline">
            musicaoesteventas@gmail.com
          </a>
        </p>
      </section>

      <p className="text-xs text-blue-700">
        <Link to="/" className="hover:text-brand-600">← Volver a la tienda</Link>
      </p>
    </div>
  </div>
);
