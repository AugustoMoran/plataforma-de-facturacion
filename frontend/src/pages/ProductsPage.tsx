import { useState, useRef, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';

import {
  useGetProductsQuery,
  useDeleteProductMutation,
  useCreateProductMutation,
  useUpdateProductMutation,
  type Product,
} from '../api/productsApi';
import { useGetCategoriesQuery } from '../api/categoriesApi';
import { TableSkeleton } from '../components/common/SkeletonLoader';
import { PermissionGate } from '../components/common/PermissionGate';

const DEFAULT_IMAGE = 'https://via.placeholder.com/40?text=P';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, isLoading, isFetching } = useGetProductsQuery({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
  });

  const [deleteProduct] = useDeleteProductMutation();

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400);
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await deleteProduct(id).unwrap();
      toast.success('Producto eliminado');
    } catch {
      toast.error('Error al eliminar producto');
    }
  };

  const products = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Productos</h1>
          <p className="text-muted-foreground">
            {pagination?.total ?? 0} productos en total
          </p>
        </div>
        <PermissionGate permission="createProducts">
          <button
            onClick={() => { setEditProduct(null); setShowForm(true); }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
            Nuevo Producto
          </button>
        </PermissionGate>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <input
          type="text"
          placeholder="Buscar por nombre, código..."
          value={search}
          onChange={handleSearchChange}
          className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Categoría</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Costo</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Precio Público</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    <Package size={32} className="mx-auto mb-2 opacity-40" />
                    No se encontraron productos
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.imageUrl ?? DEFAULT_IMAGE}
                          alt={product.name}
                          className="h-8 w-8 rounded object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                        />
                        <div>
                          <p className="font-medium text-foreground">{product.name}</p>
                          {product.barcode && (
                            <p className="text-xs text-muted-foreground">{product.barcode}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {typeof product.categoryId === 'object' ? product.categoryId.name : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                      ${product.cost.toLocaleString('es-AR')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                      ${product.publicPrice.toLocaleString('es-AR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <PermissionGate permission="editProducts">
                          <button
                            onClick={() => { setEditProduct(product); setShowForm(true); }}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Editar"
                          >
                            <Edit size={15} />
                          </button>
                        </PermissionGate>
                        <PermissionGate permission="deleteProducts">
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            aria-label="Eliminar"
                          >
                            <Trash2 size={15} />
                          </button>
                        </PermissionGate>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Página {pagination.page} de {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={!pagination.hasPrev || isFetching}
                  className="rounded border border-border px-3 py-1 text-xs hover:bg-muted disabled:opacity-40 transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasNext || isFetching}
                  className="rounded border border-border px-3 py-1 text-xs hover:bg-muted disabled:opacity-40 transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Product form modal */}
      {showForm && (
        <ProductFormModal
          product={editProduct}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

function ProductFormModal({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const { data: categoriesData } = useGetCategoriesQuery({ limit: 100 });
  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();

  const [form, setForm] = useState({
    name: product?.name ?? '',
    description: product?.description ?? '',
    categoryId: typeof product?.categoryId === 'object' ? product.categoryId._id : product?.categoryId ?? '',
    barcode: product?.barcode ?? '',
    internalCode: product?.internalCode ?? '',
    cost: product?.cost?.toString() ?? '',
    ivaPercentage: product?.ivaPercentage?.toString() ?? '21',
    profitPercentage: product?.profitPercentage?.toString() ?? '',
    publicPrice: product?.publicPrice?.toString() ?? '',
    minStock: product?.minStock?.toString() ?? '0',
  });

  const isLoading = creating || updating;

  // Reactive price calculation
  const handleFieldChange = (field: string, value: string) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      const cost = parseFloat(updated.cost) || 0;
      const iva = parseFloat(updated.ivaPercentage) || 0;
      const profit = parseFloat(updated.profitPercentage) || 0;
      const publicPrice = parseFloat(updated.publicPrice) || 0;

      if (field !== 'publicPrice' && cost > 0 && iva >= 0 && profit > 0) {
        updated.publicPrice = (cost * (1 + iva / 100) * (1 + profit / 100)).toFixed(2);
      } else if (field === 'publicPrice' && cost > 0 && iva >= 0 && publicPrice > 0) {
        const calculatedProfit = (publicPrice / (cost * (1 + iva / 100)) - 1) * 100;
        updated.profitPercentage = calculatedProfit.toFixed(2);
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        categoryId: form.categoryId || undefined,
        barcode: form.barcode || undefined,
        internalCode: form.internalCode || undefined,
        cost: parseFloat(form.cost),
        ivaPercentage: parseFloat(form.ivaPercentage),
        profitPercentage: parseFloat(form.profitPercentage),
        publicPrice: parseFloat(form.publicPrice),
        minStock: parseInt(form.minStock, 10),
      };

      if (product) {
        await updateProduct({ id: product._id, data: payload }).unwrap();
        toast.success('Producto actualizado');
      } else {
        await createProduct(payload as Parameters<typeof createProduct>[0]).unwrap();
        toast.success('Producto creado');
      }
      onClose();
    } catch {
      toast.error('Error al guardar producto');
    }
  };

  const categories = categoriesData?.data ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            {product ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Nombre *</label>
              <input
                required
                value={form.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Categoría</label>
              <select
                value={form.categoryId}
                onChange={(e) => handleFieldChange('categoryId', e.target.value)}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Código de barras</label>
              <input
                value={form.barcode}
                onChange={(e) => handleFieldChange('barcode', e.target.value)}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Costo *</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.cost}
                onChange={(e) => handleFieldChange('cost', e.target.value)}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">IVA %</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.ivaPercentage}
                onChange={(e) => handleFieldChange('ivaPercentage', e.target.value)}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Ganancia %</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.profitPercentage}
                onChange={(e) => handleFieldChange('profitPercentage', e.target.value)}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Precio público</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.publicPrice}
                onChange={(e) => handleFieldChange('publicPrice', e.target.value)}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Stock mínimo</label>
              <input
                type="number"
                min="0"
                value={form.minStock}
                onChange={(e) => handleFieldChange('minStock', e.target.value)}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
