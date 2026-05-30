import { useState } from 'react';
import { AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';

import { useGetStockQuery, useTransferStockMutation, useAdjustStockMutation } from '../api/stockApi';
import { useGetBranchesQuery } from '../api/branchesApi';
import { TableSkeleton } from '../components/common/SkeletonLoader';
import { PermissionGate } from '../components/common/PermissionGate';

export default function StockPage() {
  const [branchFilter, setBranchFilter] = useState('');
  const [showTransfer, setShowTransfer] = useState(false);

  const { data: stockData, isLoading } = useGetStockQuery({
    branchId: branchFilter || undefined,
  });
  const { data: branchesData } = useGetBranchesQuery({ active: true, limit: 100 });
  const [transferStock, { isLoading: transferring }] = useTransferStockMutation();

  const stock = stockData?.data ?? [];
  const branches = branchesData?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stock</h1>
          <p className="text-muted-foreground">{stock.length} items</p>
        </div>
        <PermissionGate permission="transferStock">
          <button
            onClick={() => setShowTransfer(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <ArrowRightLeft size={16} />
            Transferir Stock
          </button>
        </PermissionGate>
      </div>

      {/* Branch filter */}
      {branches.length > 0 && (
        <div className="flex gap-2">
          <button
            onClick={() => setBranchFilter('')}
            className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
              !branchFilter ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            Todas las sucursales
          </button>
          {branches.map((b) => (
            <button
              key={b._id}
              onClick={() => setBranchFilter(b._id)}
              className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                branchFilter === b._id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Sucursal</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Cantidad</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Stock Mínimo</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody>
              {stock.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-muted-foreground">
                    No hay stock registrado
                  </td>
                </tr>
              ) : (
                stock.map((item) => {
                  const isLow = item.quantity <= item.minStock && item.minStock > 0;
                  const isOut = item.quantity === 0;
                  return (
                    <tr key={item._id} className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${isOut ? 'bg-red-500/5' : isLow ? 'bg-yellow-500/5' : ''}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{item.productId.name}</p>
                        {item.productId.barcode && (
                          <p className="text-xs text-muted-foreground">{item.productId.barcode}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{item.branchId.name}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{item.minStock}</td>
                      <td className="px-4 py-3 text-center">
                        {isOut ? (
                          <span className="flex items-center justify-center gap-1 text-xs text-red-400">
                            <AlertTriangle size={12} /> Sin stock
                          </span>
                        ) : isLow ? (
                          <span className="flex items-center justify-center gap-1 text-xs text-yellow-400">
                            <AlertTriangle size={12} /> Stock bajo
                          </span>
                        ) : (
                          <span className="text-xs text-green-400">OK</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {showTransfer && (
        <TransferModal
          branches={branches}
          onClose={() => setShowTransfer(false)}
          onTransfer={transferStock}
          isLoading={transferring}
        />
      )}
    </div>
  );
}

function TransferModal({
  branches,
  onClose,
  onTransfer,
  isLoading,
}: {
  branches: Array<{ _id: string; name: string }>;
  onClose: () => void;
  onTransfer: (data: { productId: string; fromBranchId: string; toBranchId: string; quantity: number; notes?: string }) => Promise<unknown>;
  isLoading: boolean;
}) {
  const [form, setForm] = useState({
    productId: '',
    fromBranchId: '',
    toBranchId: '',
    quantity: '',
    notes: '',
  });

  const { data: stockData } = useGetStockQuery({
    branchId: form.fromBranchId || undefined,
  });

  const stockItems = stockData?.data ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onTransfer({
        productId: form.productId,
        fromBranchId: form.fromBranchId,
        toBranchId: form.toBranchId,
        quantity: parseInt(form.quantity, 10),
        notes: form.notes || undefined,
      });
      toast.success('Transferencia completada');
      onClose();
    } catch {
      toast.error('Error en la transferencia');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Transferir Stock</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Sucursal origen</label>
            <select
              required
              value={form.fromBranchId}
              onChange={(e) => setForm({ ...form, fromBranchId: e.target.value, productId: '' })}
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Seleccionar</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Sucursal destino</label>
            <select
              required
              value={form.toBranchId}
              onChange={(e) => setForm({ ...form, toBranchId: e.target.value })}
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Seleccionar</option>
              {branches.filter((b) => b._id !== form.fromBranchId).map((b) => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Producto</label>
            <select
              required
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
              disabled={!form.fromBranchId}
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              <option value="">Seleccionar producto</option>
              {stockItems.filter((s) => s.quantity > 0).map((s) => (
                <option key={s._id} value={s.productId._id}>
                  {s.productId.name} (disponible: {s.quantity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Cantidad</label>
            <input
              required
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? 'Transfiriendo...' : 'Transferir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
