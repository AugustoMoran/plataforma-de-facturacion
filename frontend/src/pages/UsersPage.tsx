import { useState } from 'react';
import { Plus, Edit, Trash2, Key } from 'lucide-react';
import { toast } from 'sonner';

import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useUpdateUserPermissionsMutation,
  type User,
} from '../api/usersApi';
import { useGetRolesQuery } from '../api/rolesApi';
import { useGetBranchesQuery } from '../api/branchesApi';
import { TableSkeleton } from '../components/common/SkeletonLoader';
import { PermissionGate } from '../components/common/PermissionGate';

export default function UsersPage() {
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [permUser, setPermUser] = useState<User | null>(null);

  const { data, isLoading } = useGetUsersQuery({ limit: 50 });
  const [deleteUser] = useDeleteUserMutation();

  const users = data?.data ?? [];

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    try {
      await deleteUser(id).unwrap();
      toast.success('Usuario eliminado');
    } catch {
      toast.error('Error al eliminar usuario');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
          <p className="text-muted-foreground">{users.length} usuarios</p>
        </div>
        <PermissionGate permission="createUsers">
          <button
            onClick={() => { setEditUser(null); setShowForm(true); }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
            Nuevo Usuario
          </button>
        </PermissionGate>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Rol</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Sucursal</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Comisión</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{user.role}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {typeof user.branchId === 'object' && user.branchId !== null
                      ? user.branchId.name
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {user.commissionPercentage}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${user.isActive ? 'bg-green-400/10 text-green-400' : 'bg-muted text-muted-foreground'}`}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <PermissionGate permission="editUsers">
                        <button
                          onClick={() => setPermUser(user)}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Permisos"
                        >
                          <Key size={15} />
                        </button>
                        <button
                          onClick={() => { setEditUser(user); setShowForm(true); }}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Edit size={15} />
                        </button>
                      </PermissionGate>
                      <PermissionGate permission="deleteUsers">
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </PermissionGate>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <UserFormModal user={editUser} onClose={() => setShowForm(false)} />
      )}
      {permUser && (
        <PermissionsModal user={permUser} onClose={() => setPermUser(null)} />
      )}
    </div>
  );
}

function UserFormModal({ user, onClose }: { user: User | null; onClose: () => void }) {
  const { data: rolesData } = useGetRolesQuery({ limit: 50 });
  const { data: branchesData } = useGetBranchesQuery({ active: true, limit: 50 });
  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation();

  const [form, setForm] = useState({
    email: user?.email ?? '',
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    password: '',
    roleId: (typeof user?.role === 'string' ? user.role : '') ?? '',
    branchId: (typeof user?.branchId === 'object' && user.branchId !== null ? user.branchId._id : user?.branchId ?? '') ?? '',
    commissionPercentage: user?.commissionPercentage?.toString() ?? '0',
  });

  const isLoading = creating || updating;
  const roles = rolesData?.data ?? [];
  const branches = branchesData?.data ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        roleId: form.roleId,
        branchId: form.branchId || undefined,
        commissionPercentage: parseFloat(form.commissionPercentage),
        ...(form.password ? { password: form.password } : {}),
      };
      if (user) {
        await updateUser({ id: user._id, data: payload }).unwrap();
        toast.success('Usuario actualizado');
      } else {
        if (!form.password) { toast.error('La contraseña es requerida'); return; }
        await createUser({ ...payload, password: form.password }).unwrap();
        toast.success('Usuario creado');
      }
      onClose();
    } catch {
      toast.error('Error al guardar usuario');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            {user ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Nombre *</label>
              <input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Apellido *</label>
              <input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Email *</label>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                {user ? 'Nueva contraseña (dejar en blanco para no cambiar)' : 'Contraseña *'}
              </label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Rol *</label>
              <select required value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Seleccionar</option>
                {roles.map((r) => <option key={r._id} value={r._id}>{r.displayName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Sucursal</label>
              <select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Sin sucursal</option>
                {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Comisión %</label>
              <input type="number" min="0" max="100" step="0.1" value={form.commissionPercentage}
                onChange={(e) => setForm({ ...form, commissionPercentage: e.target.value })}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
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

const ALL_PERMISSIONS = [
  'viewProducts', 'createProducts', 'editProducts', 'deleteProducts',
  'viewSales', 'createSales', 'cancelSales',
  'viewStock', 'editStock', 'transferStock',
  'viewBranches', 'createBranches', 'editBranches', 'deleteBranches',
  'viewUsers', 'createUsers', 'editUsers', 'deleteUsers',
  'manageRoles', 'viewReports',
];

function PermissionsModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [updatePermissions, { isLoading }] = useUpdateUserPermissionsMutation();
  const [permissions, setPermissions] = useState<Record<string, boolean>>(user.permissions ?? {});

  const handleToggle = (key: string) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    try {
      await updatePermissions({ id: user._id, permissions }).unwrap();
      toast.success('Permisos actualizados');
      onClose();
    } catch {
      toast.error('Error al actualizar permisos');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            Permisos: {user.firstName} {user.lastName}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-3">
          {ALL_PERMISSIONS.map((perm) => (
            <label key={perm} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={permissions[perm] === true}
                onChange={() => handleToggle(perm)}
                className="h-4 w-4 rounded border-input bg-background text-primary focus:ring-primary"
              />
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                {perm}
              </span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">Cancelar</button>
          <button onClick={handleSave} disabled={isLoading}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {isLoading ? 'Guardando...' : 'Guardar permisos'}
          </button>
        </div>
      </div>
    </div>
  );
}
