import { useState } from 'react';
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  useGetBranchesQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
  type Branch,
} from '../api/branchesApi';
import { TableSkeleton } from '../components/common/SkeletonLoader';
import { PermissionGate } from '../components/common/PermissionGate';

export default function BranchesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editBranch, setEditBranch] = useState<Branch | null>(null);

  const { data, isLoading } = useGetBranchesQuery({ limit: 50 });
  const [deleteBranch] = useDeleteBranchMutation();

  const branches = data?.data ?? [];

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta sucursal?')) return;
    try {
      await deleteBranch(id).unwrap();
      toast.success('Sucursal eliminada');
    } catch {
      toast.error('Error al eliminar sucursal');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sucursales</h1>
          <p className="text-muted-foreground">{branches.length} sucursales</p>
        </div>
        <PermissionGate permission="createBranches">
          <button
            onClick={() => { setEditBranch(null); setShowForm(true); }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
            Nueva Sucursal
          </button>
        </PermissionGate>
      </div>

      {isLoading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {branches.length === 0 ? (
            <div className="col-span-full text-center py-10 text-muted-foreground">
              <Building2 size={32} className="mx-auto mb-2 opacity-40" />
              No hay sucursales registradas
            </div>
          ) : (
            branches.map((branch) => (
              <div key={branch._id} className="rounded-xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{branch.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{branch.address}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${branch.isActive ? 'bg-green-400/10 text-green-400' : 'bg-muted text-muted-foreground'}`}>
                    {branch.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                {branch.phone && <p className="text-xs text-muted-foreground">📞 {branch.phone}</p>}
                {branch.email && <p className="text-xs text-muted-foreground">✉ {branch.email}</p>}
                <div className="flex justify-end gap-2 pt-2">
                  <PermissionGate permission="editBranches">
                    <button
                      onClick={() => { setEditBranch(branch); setShowForm(true); }}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Edit size={15} />
                    </button>
                  </PermissionGate>
                  <PermissionGate permission="deleteBranches">
                    <button
                      onClick={() => handleDelete(branch._id)}
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </PermissionGate>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showForm && (
        <BranchFormModal
          branch={editBranch}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

function BranchFormModal({ branch, onClose }: { branch: Branch | null; onClose: () => void }) {
  const [createBranch, { isLoading: creating }] = useCreateBranchMutation();
  const [updateBranch, { isLoading: updating }] = useUpdateBranchMutation();

  const [form, setForm] = useState({
    name: branch?.name ?? '',
    address: branch?.address ?? '',
    phone: branch?.phone ?? '',
    email: branch?.email ?? '',
  });

  const isLoading = creating || updating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        address: form.address,
        phone: form.phone || undefined,
        email: form.email || undefined,
      };
      if (branch) {
        await updateBranch({ id: branch._id, data: payload }).unwrap();
        toast.success('Sucursal actualizada');
      } else {
        await createBranch(payload).unwrap();
        toast.success('Sucursal creada');
      }
      onClose();
    } catch {
      toast.error('Error al guardar sucursal');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            {branch ? 'Editar Sucursal' : 'Nueva Sucursal'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {['name', 'address', 'phone', 'email'].map((field) => (
            <div key={field}>
              <label className="block text-xs font-medium text-muted-foreground mb-1 capitalize">
                {field === 'name' ? 'Nombre *' : field === 'address' ? 'Dirección *' : field === 'phone' ? 'Teléfono' : 'Email'}
              </label>
              <input
                required={field === 'name' || field === 'address'}
                type={field === 'email' ? 'email' : 'text'}
                value={form[field as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ))}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
