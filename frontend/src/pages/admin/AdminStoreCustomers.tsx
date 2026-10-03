import React from 'react';
import { useGetStoreCustomersQuery } from '../../services/authApi';

const money = (value?: number) =>
  `$${(Number(value) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

export const AdminStoreCustomers: React.FC = () => {
  const { data: customers = [], isLoading } = useGetStoreCustomersQuery();

  return (
    <div className="space-y-6">
      <div>
        <p className="section-heading">Ecommerce</p>
        <h1 className="page-title text-blue-950">Clientes de la tienda</h1>
        <p className="page-sub text-blue-800">
          Usuarios registrados con rol <code>user</code> y sus datos de contacto / envío.
        </p>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-blue-800">Cargando clientes...</div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center text-sm text-blue-800">No hay clientes registrados todavía.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Contacto</th>
                  <th>Dirección</th>
                  <th>Email verificado</th>
                  <th>Pedidos</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer: any) => (
                  <tr key={customer._id}>
                    <td>
                      <p className="font-semibold text-blue-950">{customer.name}</p>
                      <p className="text-xs text-blue-700">{new Date(customer.createdAt).toLocaleDateString('es-AR')}</p>
                    </td>
                    <td>
                      <p className="text-sm text-blue-950">{customer.email}</p>
                      <p className="text-xs text-blue-700">{customer.phone || '—'}</p>
                    </td>
                    <td className="text-xs text-blue-800 max-w-xs">
                      {[
                        customer.defaultShippingAddress?.street,
                        customer.defaultShippingAddress?.city,
                        customer.defaultShippingAddress?.province,
                        customer.defaultShippingAddress?.postalCode,
                      ].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td>
                      <span className={customer.emailVerified ? 'badge-blue' : 'badge-gray'}>
                        {customer.emailVerified ? 'Sí' : 'Pendiente'}
                      </span>
                    </td>
                    <td>{customer.metrics?.ordersCount || 0}</td>
                    <td className="font-semibold text-blue-950">{money(customer.metrics?.totalSpent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
