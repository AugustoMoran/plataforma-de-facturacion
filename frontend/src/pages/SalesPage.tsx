import { useState } from 'react';
import { Plus, Search, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { useGetSalesQuery, useCancelSaleMutation, type Sale } from '../api/salesApi';
import { TableSkeleton } from '../components/common/SkeletonLoader';
import { PermissionGate } from '../components/common/PermissionGate';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  completed: { label: 'Completada', color: 'text-green-400 bg-green-400/10' },
  cancelled: { label: 'Cancelada', color: 'text-red-400 bg-red-400/10' },
  refunded: { label: 'Devuelta', color: 'text-yellow-400 bg-yellow-400/10' },
  partially_refunded: { label: 'Dev. Parcial', color: 'text-orange-400 bg-orange-400/10' },
};

const AFIP_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendiente', color: 'text-yellow-400' },
  PROCESSING: { label: 'Procesando', color: 'text-blue-400' },
  APPROVED: { label: 'Aprobada', color: 'text-green-400' },
  REJECTED: { label: 'Rechazada', color: 'text-red-400' },
  ERROR: { label: 'Error', color: 'text-red-400' },
};

export default function SalesPage() {
  const [page, setPage] = useState(1);
  const [showNewSale, setShowNewSale] = useState(false);

  const { data, isLoading, isFetching } = useGetSalesQuery({ page, limit: 20 });
  const [cancelSale] = useCancelSaleMutation();

  const handleCancel = async (id: string) => {
    const reason = prompt('Motivo de cancelación:');
    if (!reason) return;
    try {
      await cancelSale({ id, reason }).unwrap();
      toast.success('Venta cancelada');
    } catch {
      toast.error('No se pudo cancelar la venta');
    }
  };

  const sales = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ventas</h1>
          <p className="text-muted-foreground">{pagination?.total ?? 0} ventas en total</p>
        </div>
        <PermissionGate permission="createSales">
          <button
            onClick={() => setShowNewSale(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
            Nueva Venta
          </button>
        </PermissionGate>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Vendedor</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Tipo</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Total</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">AFIP</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-muted-foreground">
                    No hay ventas registradas
                  </td>
                </tr>
              ) : (
                sales.map((sale) => {
                  const statusInfo = STATUS_LABELS[sale.status] ?? { label: sale.status, color: 'text-muted-foreground' };
                  const afipInfo = sale.afip ? AFIP_STATUS[sale.afip.status] : null;
                  return (
                    <tr key={sale._id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">
                        {format(new Date(sale.createdAt), 'dd/MM/yy HH:mm', { locale: es })}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {sale.sellerName}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${sale.saleType === 'FACTURADA' ? 'bg-blue-500/10 text-blue-400' : 'bg-muted text-muted-foreground'}`}>
                          {sale.saleType === 'FACTURADA' ? 'Facturada' : 'No facturada'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                        ${sale.total.toLocaleString('es-AR')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {afipInfo ? (
                          <span className={`text-xs ${afipInfo.color}`}>{afipInfo.label}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {sale.status === 'completed' && (
                          <PermissionGate permission="cancelSales">
                            <button
                              onClick={() => handleCancel(sale._id)}
                              className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              title="Cancelar venta"
                            >
                              <XCircle size={15} />
                            </button>
                          </PermissionGate>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Página {pagination.page} de {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={!pagination.hasPrev || isFetching}
                  className="rounded border border-border px-3 py-1 text-xs hover:bg-muted disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasNext || isFetching}
                  className="rounded border border-border px-3 py-1 text-xs hover:bg-muted disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
