import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRolePermissionsMutation,
  useDeleteRoleMutation,
  type Role,
} from '../api/rolesApi';
import { TableSkeleton } from '../components/common/SkeletonLoader';
import { PermissionGate } from '../components/common/PermissionGate';

const ALL_PERMISSIONS = [
  { key: 'viewProducts', label: 'Ver Productos' },
  { key: 'createProducts', label: 'Crear Productos' },
  { key: 'editProducts', label: 'Editar Productos' },
  { key: 'deleteProducts', label: 'Eliminar Productos' },
  { key: 'viewSales', label: 'Ver Ventas' },
  { key: 'createSales', label: 'Crear Ventas' },
  { key: 'cancelSales', label: 'Cancelar Ventas' },
  { key: 'viewStock', label: 'Ver Stock' },
  { key: 'editStock', label: 'Editar Stock' },
  { key: 'transferStock', label: 'Transferir Stock' },
  { key: 'viewBranches', label: 'Ver Sucursales' },
  { key: 'createBranches', label: 'Crear Sucursales' },
  { key: 'editBranches', label: 'Editar Sucursales' },
  { key: 'deleteBranches', label: 'Eliminar Sucursales' },
  { key: 'viewUsers', label: 'Ver Usuarios' },
  { key: 'createUsers', label: 'Crear Usuarios' },
  { key: 'editUsers', label: 'Editar Usuarios' },
  { key: 'deleteUsers', label: 'Eliminar Usuarios' },
  { key: 'manageRoles', label: 'Gestionar Roles' },
  { key: 'viewReports', label: 'Ver Reportes' },
];

export default function RolesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);

  const { data, isLoading } = useGetRolesQuery({ limit: 50 });
  const [deleteRole] = useDeleteRoleMutation();

  const roles = data?.data ?? [];

  const handleDelete = async (role: Role) => {
    if (role.isSystem) { toast.error('No se puede eliminar un rol del sistema'); return; }
    if (!confirm('¿Eliminar este rol?')) return;
    try {
      await deleteRole(role._id).unwrap();
      toast.success('Rol eliminado');
    } catch {
      toast.error('Error al eliminar rol');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Roles y Permisos</h1>
          <p className="text-muted-foreground">{roles.length} roles configurados</p>
        </div>
        <PermissionGate permission="manageRoles">
          <button
            onClick={() => { setEditRole(null); setShowForm(true); }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
            Nuevo Rol
          </button>
        </PermissionGate>
      </div>

      {isLoading ? (
        <TableSkeleton rows={3} cols={4} />
      ) : (
        <div className="space-y-4">
          {roles.map((role) => (
            <div key={role._id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">{role.displayName}</h3>
                  <p className="text-xs text-muted-foreground">{role.name}{role.isSystem ? ' • Sistema' : ''}</p>
                </div>
                <div className="flex gap-2">
                  <PermissionGate permission="manageRoles">
                    <button
                      onClick={() => { setEditRole(role); setShowForm(true); }}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Edit size={15} />
                    </button>
                    {!role.isSystem && (
                      <button
                        onClick={() => handleDelete(role)}
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </PermissionGate>
                </div>
              </div>

              {/* Permission matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {ALL_PERMISSIONS.map((perm) => (
                  <div key={perm.key} className={`flex items-center gap-1.5 text-xs py-1 px-2 rounded ${
                    role.permissions[perm.key] ? 'bg-green-500/10 text-green-400' : 'bg-muted/30 text-muted-foreground line-through opacity-50'
                  }`}>
                    <span>{role.permissions[perm.key] ? '✓' : '✗'}</span>
                    <span>{perm.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <RoleFormModal role={editRole} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}

function RoleFormModal({ role, onClose }: { role: Role | null; onClose: () => void }) {
  const [createRole, { isLoading: creating }] = useCreateRoleMutation();
  const [updateRolePermissions, { isLoading: updating }] = useUpdateRolePermissionsMutation();

  const [form, setForm] = useState({
    name: role?.name ?? '',
    displayName: role?.displayName ?? '',
    permissions: { ...(role?.permissions ?? {}) },
  });

  const isLoading = creating || updating;

  const handleToggle = (key: string) => {
    setForm((prev) => ({
      ...prev,
      permissions: { ...prev.permissions, [key]: !prev.permissions[key] },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (role) {
        await updateRolePermissions({ id: role._id, permissions: form.permissions }).unwrap();
        toast.success('Permisos actualizados (en tiempo real a todos los usuarios)');
      } else {
        await createRole({
          name: form.name,
          displayName: form.displayName,
          permissions: form.permissions,
        }).unwrap();
        toast.success('Rol creado');
      }
      onClose();
    } catch {
      toast.error('Error al guardar rol');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            {role ? `Editar: ${role.displayName}` : 'Nuevo Rol'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {!role && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Nombre interno *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="vendedor_senior"
                  className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Nombre visible *</label>
                <input required value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  placeholder="Vendedor Senior"
                  className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Permisos</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ALL_PERMISSIONS.map((perm) => (
                <label key={perm.key} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={form.permissions[perm.key] === true}
                    onChange={() => handleToggle(perm.key)}
                    className="h-4 w-4 rounded border-input bg-background text-primary"
                  />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    {perm.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">Cancelar</button>
            <button type="submit" disabled={isLoading}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
