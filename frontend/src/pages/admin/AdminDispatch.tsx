import React from 'react';
import {
  useCreateDispatchShipmentMutation,
  useGetDispatchOrdersQuery,
  useGetPickupOrdersQuery,
  useNotifyPickupReadyMutation,
  useRefreshDispatchShipmentMutation,
} from '../../services/shippingApi';

const money = (value?: number) =>
  `$${(Number(value) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

const statusLabel: Record<string, string> = {
  awaiting_dispatch: 'Pendiente de despacho',
  awaiting_pickup: 'Pendiente de retiro en tienda',
  ready_for_pickup: 'Listo para retirar',
  label_ready: 'Etiqueta lista',
  shipped: 'En camino',
  delivered: 'Entregado',
};

export const AdminDispatch: React.FC = () => {
  const { data: orders = [], isLoading, refetch } = useGetDispatchOrdersQuery();
  const { data: pickupOrders = [], isLoading: loadingPickup, refetch: refetchPickup } = useGetPickupOrdersQuery();
  const [createShipment, { isLoading: creating }] = useCreateDispatchShipmentMutation();
  const [refreshShipment, { isLoading: refreshing }] = useRefreshDispatchShipmentMutation();
  const [notifyPickupReady, { isLoading: notifyingPickup }] = useNotifyPickupReadyMutation();
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');

  const handleCreate = async (saleId: string) => {
    setMessage('');
    setError('');
    try {
      await createShipment(saleId).unwrap();
      setMessage('Envío generado en EnvioPack. Revisá tu panel para imprimir la etiqueta.');
      refetch();
    } catch (err: any) {
      setError(err?.data?.message || 'No se pudo generar el envío');
    }
  };

  const handleRefresh = async (saleId: string) => {
    setMessage('');
    setError('');
    try {
      await refreshShipment(saleId).unwrap();
      setMessage('Estado del envío actualizado.');
      refetch();
    } catch (err: any) {
      setError(err?.data?.message || 'No se pudo actualizar el envío');
    }
  };

  const handleNotifyPickup = async (saleId: string) => {
    setMessage('');
    setError('');
    try {
      const result = await notifyPickupReady(saleId).unwrap();
      setMessage(
        result.sent
          ? `Se avisó a ${result.customerEmail} que el pedido está listo para retirar.`
          : `Pedido marcado como listo. Configurá SMTP para enviar el mail automáticamente.`
      );
      refetchPickup();
    } catch (err: any) {
      setError(err?.data?.message || 'No se pudo avisar al cliente');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="section-heading">Ecommerce</p>
        <h1 className="page-title text-blue-950">Pedidos y despachos</h1>
        <p className="page-sub text-blue-800">
          Gestioná envíos EnvioPack y retiros en sucursal desde un solo lugar.
        </p>
      </div>

      {message ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div> : null}
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-blue-950">Retiros en sucursal</h2>
          <p className="text-sm text-blue-800">
            Cuando el pedido esté preparado, avisale al cliente con un mail automático.
          </p>
        </div>

        <div className="card overflow-hidden">
          {loadingPickup ? (
            <div className="p-8 text-center text-sm text-blue-800">Cargando retiros...</div>
          ) : pickupOrders.length === 0 ? (
            <div className="p-8 text-center text-sm text-blue-800">No hay pedidos pendientes de retiro.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Sucursal</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pickupOrders.map((order: any) => (
                    <tr key={order._id}>
                      <td>
                        <p className="font-semibold text-blue-950">{order.invoiceNumber}</p>
                        <p className="text-xs text-blue-700">{new Date(order.createdAt).toLocaleString('es-AR')}</p>
                      </td>
                      <td>
                        <p className="text-blue-950">{order.clientName}</p>
                        <p className="text-xs text-blue-700">{order.customerEmail || order.customerPhone}</p>
                      </td>
                      <td>
                        <p className="text-sm text-blue-950">
                          {order.shippingQuote?.pickupBranch?.name || 'Sucursal Oso Sound'}
                        </p>
                        <p className="text-xs text-blue-700">
                          {order.shippingQuote?.pickupBranch?.address || '—'}
                        </p>
                      </td>
                      <td className="font-semibold text-blue-950">{money(order.total)}</td>
                      <td>
                        <span className="badge-blue">{statusLabel[order.shippingStatus] || order.shippingStatus}</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-primary !px-3 !py-2 text-xs"
                          disabled={notifyingPickup || order.shippingStatus === 'ready_for_pickup'}
                          onClick={() => handleNotifyPickup(order._id)}
                        >
                          {order.shippingStatus === 'ready_for_pickup' ? 'Cliente avisado' : 'Avisar listo para retiro'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-blue-950">Despachos EnvioPack</h2>
          <p className="text-sm text-blue-800">
            Pedidos pagos con envío a domicilio o sucursal de correo.
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-900">
          <p className="font-semibold">Cómo funciona</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-blue-800">
            <li>El cliente paga el producto (+ envío si eligió domicilio; sucursal gratis).</li>
            <li>Acá aparece el pedido con el monto que tenés que cargar en EnvioPack.</li>
            <li>Generás el envío desde este panel y completás el pago en tu cuenta EnvioPack.</li>
            <li>Imprimís la etiqueta desde EnvioPack y despachás desde Ituzaingó (depósito 18048).</li>
          </ol>
        </div>

        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-blue-800">Cargando despachos...</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-sm text-blue-800">No hay pedidos pendientes de despacho.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Envío</th>
                    <th>Cobrado</th>
                    <th>Costo EnvioPack</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order: any) => (
                    <tr key={order._id}>
                      <td>
                        <p className="font-semibold text-blue-950">{order.invoiceNumber}</p>
                        <p className="text-xs text-blue-700">{new Date(order.createdAt).toLocaleString('es-AR')}</p>
                      </td>
                      <td>
                        <p className="text-blue-950">{order.clientName}</p>
                        <p className="text-xs text-blue-700">{order.customerPhone || order.customerEmail}</p>
                      </td>
                      <td>
                        <p className="text-sm text-blue-950">{order.shippingMethod || '—'}</p>
                        {order.shippingQuote?.sucursal ? (
                          <p className="text-xs text-blue-700">
                            Sucursal correo: {order.shippingQuote.sucursal.nombre} · {order.shippingQuote.sucursal.calle}{' '}
                            {order.shippingQuote.sucursal.numero}
                          </p>
                        ) : (
                          <p className="text-xs text-blue-700">{order.shippingAddress?.street}</p>
                        )}
                      </td>
                      <td className="font-semibold text-blue-950">{money(order.shippingCost)}</td>
                      <td className="font-semibold text-amber-700">
                        {money(order.envioPackSellerCost || order.shippingQuote?.sellerCost)}
                      </td>
                      <td>
                        <span className="badge-blue">{statusLabel[order.shippingStatus] || order.shippingStatus}</span>
                        {order.trackingNumber ? (
                          <p className="mt-1 text-xs text-blue-700">Tracking: {order.trackingNumber}</p>
                        ) : null}
                      </td>
                      <td>
                        <div className="flex flex-col gap-2">
                          {!order.envioPackEnvioId ? (
                            <button
                              type="button"
                              className="btn-primary !px-3 !py-2 text-xs"
                              disabled={creating}
                              onClick={() => handleCreate(order._id)}
                            >
                              Generar envío
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn-secondary !px-3 !py-2 text-xs"
                              disabled={refreshing}
                              onClick={() => handleRefresh(order._id)}
                            >
                              Actualizar estado
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
