import React, { useMemo, useState } from 'react';
import {
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useGetCategoriesQuery,
  useUpdateCategoryMutation,
} from '../../services/categoryApi';
import {
  useCreateBranchMutation,
  useDeleteBranchMutation,
  useGetBranchesQuery,
  useUpdateBranchMutation,
} from '../../services/branchApi';
import {
  useCreateSupplierMutation,
  useDeleteSupplierMutation,
  useGetSuppliersQuery,
  useUpdateSupplierMutation,
} from '../../services/supplierApi';

export const AdminCatalog: React.FC = () => {
  const { data: categories = [], isLoading: loadingCategories } = useGetCategoriesQuery(true);
  const { data: branches = [], isLoading: loadingBranches } = useGetBranchesQuery({});
  const { data: suppliers = [], isLoading: loadingSuppliers } = useGetSuppliersQuery();
  const [createCategory, { isLoading: creatingCategory }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: updatingCategory }] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [createBranch, { isLoading: creatingBranch }] = useCreateBranchMutation();
  const [updateBranch, { isLoading: updatingBranch }] = useUpdateBranchMutation();
  const [deleteBranch] = useDeleteBranchMutation();
  const [createSupplier, { isLoading: creatingSupplier }] = useCreateSupplierMutation();
  const [updateSupplier, { isLoading: updatingSupplier }] = useUpdateSupplierMutation();
  const [deleteSupplier] = useDeleteSupplierMutation();

  const [categoryName, setCategoryName] = useState('');
  const [categoryVisible, setCategoryVisible] = useState(true);
  const [addingChildToParentId, setAddingChildToParentId] = useState<string | null>(null);
  const [childCategoryName, setChildCategoryName] = useState('');
  const [childCategoryVisible, setChildCategoryVisible] = useState(true);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [editingCategoryVisible, setEditingCategoryVisible] = useState(true);

  const rootCategories = useMemo(
    () => categories.filter((c: any) => !c.parent),
    [categories]
  );

  const getParentName = (parentId?: string | null) => {
    if (!parentId) return '';
    const parent = categories.find((c: any) => String(c._id) === String(parentId));
    return parent?.name || '';
  };

  const categoryKey = (c: any) => `${normalize(c.name)}::${c.parent || ''}`;

  const getSubcategories = (parentId: string) =>
    categories.filter((c: any) => String(c.parent) === String(parentId));

  const [branchForm, setBranchForm] = useState({ name: '', address: '', phone: '', city: '', province: '', postalCode: '', country: 'Argentina' });
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [editingBranchForm, setEditingBranchForm] = useState({ name: '', address: '', phone: '', city: '', province: '', postalCode: '', country: 'Argentina' });

  const [supplierForm, setSupplierForm] = useState({ name: '', contactName: '', email: '', phone: '' });
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [editingSupplierForm, setEditingSupplierForm] = useState({ name: '', contactName: '', email: '', phone: '' });

  const normalize = (v: string) => v.trim().toLowerCase();

  const branchMissingLocation = (branch: any) =>
    !branch?.city?.trim() || !branch?.province?.trim() || !branch?.postalCode?.trim();

  const BranchLocationWarning = ({ branch }: { branch: any }) => {
    if (!branchMissingLocation(branch)) return null;
    return (
      <span
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30 text-xs font-bold flex-shrink-0"
        title="Faltan datos de ubicación (ciudad, provincia o código postal) requeridos para envíos de tienda"
      >
        !
      </span>
    );
  };

  const handleCreateCategory = async () => {
    const name = categoryName.trim();
    if (!name) return;

    if (categories.some((c: any) => categoryKey(c) === categoryKey({ name, parent: null }))) {
      alert('Ya existe una categoría raíz con ese nombre');
      return;
    }

    try {
      await createCategory({
        name,
        parent: null,
        visibleInEcommerce: categoryVisible,
      }).unwrap();
      setCategoryName('');
      setCategoryVisible(true);
    } catch (err: any) {
      alert(err?.data?.message || 'Error al crear categoría');
    }
  };

  const handleCreateSubcategory = async (parentId: string) => {
    const name = childCategoryName.trim();
    if (!name) return;

    if (categories.some((c: any) => categoryKey(c) === categoryKey({ name, parent: parentId }))) {
      alert('Ya existe una subcategoría con ese nombre en esta categoría');
      return;
    }

    try {
      await createCategory({
        name,
        parent: parentId,
        visibleInEcommerce: childCategoryVisible,
      }).unwrap();
      setChildCategoryName('');
      setChildCategoryVisible(true);
      setAddingChildToParentId(null);
    } catch (err: any) {
      alert(err?.data?.message || 'Error al crear subcategoría');
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategoryId) return;
    const name = editingCategoryName.trim();
    if (!name) {
      alert('El nombre de categoría es obligatorio');
      return;
    }

    const editingCategory = categories.find((c: any) => c._id === editingCategoryId);
    const parentForCheck = editingCategory?.parent || null;
    if (
      categories.some(
        (c: any) =>
          c._id !== editingCategoryId &&
          categoryKey(c) === categoryKey({ name, parent: parentForCheck })
      )
    ) {
      alert('Ya existe una categoría con ese nombre en este nivel');
      return;
    }

    try {
      await updateCategory({
        id: editingCategoryId,
        body: {
          name,
          parent: parentForCheck,
          visibleInEcommerce: editingCategoryVisible,
        },
      }).unwrap();
      setEditingCategoryId(null);
      setEditingCategoryName('');
      setEditingCategoryVisible(true);
    } catch (err: any) {
      alert(err?.data?.message || 'Error al actualizar categoría');
    }
  };

  const handleCreateBranch = async () => {
    if (!branchForm.name.trim() || !branchForm.address.trim()) {
      alert('Nombre y dirección son obligatorios');
      return;
    }

    if (branches.some((b: any) => normalize(b.name) === normalize(branchForm.name))) {
      alert('Ya existe una sucursal con ese nombre');
      return;
    }

    try {
      await createBranch({
        name: branchForm.name.trim(),
        address: branchForm.address.trim(),
        phone: branchForm.phone.trim(),
        city: branchForm.city.trim(),
        province: branchForm.province.trim(),
        postalCode: branchForm.postalCode.trim(),
        country: branchForm.country.trim(),
      }).unwrap();
      setBranchForm({ name: '', address: '', phone: '', city: '', province: '', postalCode: '', country: 'Argentina' });
    } catch (err: any) {
      alert(err?.data?.message || 'Error al crear sucursal');
    }
  };

  const handleUpdateBranch = async () => {
    if (!editingBranchId) return;

    if (!editingBranchForm.name.trim() || !editingBranchForm.address.trim()) {
      alert('Nombre y dirección son obligatorios');
      return;
    }

    if (branches.some((b: any) => b._id !== editingBranchId && normalize(b.name) === normalize(editingBranchForm.name))) {
      alert('Ya existe una sucursal con ese nombre');
      return;
    }

    try {
      await updateBranch({
        id: editingBranchId,
        body: {
          name: editingBranchForm.name.trim(),
          address: editingBranchForm.address.trim(),
          phone: editingBranchForm.phone.trim(),
          city: editingBranchForm.city.trim(),
          province: editingBranchForm.province.trim(),
          postalCode: editingBranchForm.postalCode.trim(),
          country: editingBranchForm.country.trim(),
        },
      }).unwrap();
      setEditingBranchId(null);
      setEditingBranchForm({ name: '', address: '', phone: '', city: '', province: '', postalCode: '', country: 'Argentina' });
    } catch (err: any) {
      alert(err?.data?.message || 'Error al actualizar sucursal');
    }
  };

  const handleCreateSupplier = async () => {
    const name = supplierForm.name.trim();
    if (!name) {
      alert('El nombre del proveedor es obligatorio');
      return;
    }

    if (suppliers.some((s: any) => normalize(s.name) === normalize(name))) {
      alert('Ya existe un proveedor con ese nombre');
      return;
    }

    try {
      await createSupplier({
        name,
        contactName: supplierForm.contactName.trim(),
        email: supplierForm.email.trim(),
        phone: supplierForm.phone.trim(),
      }).unwrap();
      setSupplierForm({ name: '', contactName: '', email: '', phone: '' });
    } catch (err: any) {
      alert(err?.data?.message || 'Error al crear proveedor');
    }
  };

  const handleUpdateSupplier = async () => {
    if (!editingSupplierId) return;

    const name = editingSupplierForm.name.trim();
    if (!name) {
      alert('El nombre del proveedor es obligatorio');
      return;
    }

    if (suppliers.some((s: any) => s._id !== editingSupplierId && normalize(s.name) === normalize(name))) {
      alert('Ya existe un proveedor con ese nombre');
      return;
    }

    try {
      await updateSupplier({
        id: editingSupplierId,
        body: {
          name,
          contactName: editingSupplierForm.contactName.trim(),
          email: editingSupplierForm.email.trim(),
          phone: editingSupplierForm.phone.trim(),
        },
      }).unwrap();
      setEditingSupplierId(null);
      setEditingSupplierForm({ name: '', contactName: '', email: '', phone: '' });
    } catch (err: any) {
      alert(err?.data?.message || 'Error al actualizar proveedor');
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="page-title">Configuración Comercial</h1>
        <p className="page-sub">Administra categorías y sucursales del sistema</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="card p-6 space-y-4 xl:col-span-1">
          <h2 className="text-blue-950 font-semibold">Categorías</h2>
          <p className="text-xs text-blue-800">Creá categorías principales y agregá subcategorías desde cada una (ej: Accesorios → Cables).</p>

          <div className="space-y-2">
            <label className="section-heading">Nueva categoría principal</label>
            <input
              className="input"
              placeholder="Ej: Accesorios, Audio, Instrumentos…"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            />
            <label className="flex items-center gap-2 text-sm text-blue-900 cursor-pointer">
              <input
                type="checkbox"
                checked={categoryVisible}
                onChange={(e) => setCategoryVisible(e.target.checked)}
                className="rounded border-blue-300 text-brand-600 focus:ring-brand-500"
              />
              Visible en ecommerce
            </label>
            <button
              className="btn-primary w-full justify-center"
              onClick={handleCreateCategory}
              disabled={creatingCategory || !categoryName.trim()}
            >
              Agregar categoría
            </button>
          </div>

          <div className="surface rounded-xl p-3 max-h-80 overflow-y-auto">
            {loadingCategories ? (
              <p className="text-sm text-blue-800">Cargando categorías...</p>
            ) : rootCategories.length === 0 ? (
              <p className="text-sm text-blue-800">Aún no hay categorías creadas.</p>
            ) : (
              <div className="space-y-3">
                {rootCategories.map((root: any) => {
                  const subs = getSubcategories(root._id);
                  const renderRow = (c: any, isSub = false) => (
                    <div
                      key={c._id}
                      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 ${isSub ? 'ml-4' : ''}`}
                    >
                      {editingCategoryId === c._id ? (
                        <div className="flex flex-col w-full gap-2">
                          <input
                            className="input !py-1.5"
                            value={editingCategoryName}
                            onChange={(e) => setEditingCategoryName(e.target.value)}
                          />
                          <label className="flex items-center gap-2 text-xs text-blue-900">
                            <input
                              type="checkbox"
                              checked={editingCategoryVisible}
                              onChange={(e) => setEditingCategoryVisible(e.target.checked)}
                            />
                            Visible en ecommerce
                          </label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button className="btn-primary !py-1.5 !px-3 w-full sm:w-auto justify-center" onClick={handleUpdateCategory} disabled={updatingCategory}>Guardar</button>
                            <button
                              className="btn-secondary !py-1.5 !px-3 w-full sm:w-auto"
                              onClick={() => {
                                setEditingCategoryId(null);
                                setEditingCategoryName('');
                                setEditingCategoryVisible(true);
                              }}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="min-w-0">
                            <span className="text-sm text-blue-950 font-medium block truncate">
                              {isSub ? `↳ ${c.name}` : c.name}
                            </span>
                            <span className="text-[10px] text-blue-700">
                              {isSub ? getParentName(c.parent) : 'Categoría principal'}
                              {' · '}
                              {c.visibleInEcommerce !== false ? 'Ecommerce' : 'Solo interno'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap justify-end">
                            {!isSub && (
                              <button
                                type="button"
                                onClick={() => {
                                  setAddingChildToParentId(root._id);
                                  setChildCategoryName('');
                                  setChildCategoryVisible(true);
                                }}
                                className="text-[10px] font-semibold text-brand-700 hover:text-brand-800 px-2 py-1 rounded-lg bg-blue-100 hover:bg-blue-200"
                              >
                                + Subcategoría
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditingCategoryId(c._id);
                                setEditingCategoryName(c.name);
                                setEditingCategoryVisible(c.visibleInEcommerce !== false);
                              }}
                              className="btn-icon !text-sky-600 hover:!bg-sky-50 hover:!border-sky-200"
                              title="Editar"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`¿Eliminar "${c.name}"?`)) deleteCategory(c._id);
                              }}
                              className="btn-icon !text-red-600 hover:!bg-red-50 hover:!border-red-200"
                              title="Eliminar"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );

                  return (
                    <div key={root._id} className="space-y-1">
                      {renderRow(root)}
                      {subs.map((sub: any) => renderRow(sub, true))}
                      {addingChildToParentId === root._id && (
                        <div className="ml-4 p-3 rounded-lg border border-dashed border-brand-300 bg-brand-50 space-y-2">
                          <p className="text-xs font-semibold text-blue-900">Nueva subcategoría de {root.name}</p>
                          <input
                            className="input !py-1.5"
                            placeholder="Nombre de la subcategoría"
                            value={childCategoryName}
                            onChange={(e) => setChildCategoryName(e.target.value)}
                          />
                          <label className="flex items-center gap-2 text-xs text-blue-900">
                            <input
                              type="checkbox"
                              checked={childCategoryVisible}
                              onChange={(e) => setChildCategoryVisible(e.target.checked)}
                            />
                            Visible en ecommerce
                          </label>
                          <div className="flex gap-2">
                            <button
                              className="btn-primary !py-1.5 !px-3 text-xs"
                              disabled={creatingCategory || !childCategoryName.trim()}
                              onClick={() => handleCreateSubcategory(root._id)}
                            >
                              Guardar subcategoría
                            </button>
                            <button
                              className="btn-secondary !py-1.5 !px-3 text-xs"
                              onClick={() => {
                                setAddingChildToParentId(null);
                                setChildCategoryName('');
                              }}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="text-white font-semibold">Sucursales</h2>

          <div className="space-y-2">
            <input
              className="input"
              placeholder="Nombre de sucursal"
              value={branchForm.name}
              onChange={(e) => setBranchForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Dirección"
              value={branchForm.address}
              onChange={(e) => setBranchForm((prev) => ({ ...prev, address: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Teléfono (opcional)"
              value={branchForm.phone}
              onChange={(e) => setBranchForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                className="input"
                placeholder="Ciudad"
                value={branchForm.city}
                onChange={(e) => setBranchForm((prev) => ({ ...prev, city: e.target.value }))}
              />
              <input
                className="input"
                placeholder="Provincia"
                value={branchForm.province}
                onChange={(e) => setBranchForm((prev) => ({ ...prev, province: e.target.value }))}
              />
              <input
                className="input"
                placeholder="Código postal"
                value={branchForm.postalCode}
                onChange={(e) => setBranchForm((prev) => ({ ...prev, postalCode: e.target.value }))}
              />
              <input
                className="input"
                placeholder="País"
                value={branchForm.country}
                onChange={(e) => setBranchForm((prev) => ({ ...prev, country: e.target.value }))}
              />
            </div>
            <button
              className="btn-primary w-full"
              onClick={handleCreateBranch}
              disabled={creatingBranch}
            >
              Agregar sucursal
            </button>
          </div>

          <div className="surface rounded-xl p-3 max-h-72 overflow-y-auto">
            {loadingBranches ? (
              <p className="text-sm text-slate-500">Cargando sucursales...</p>
            ) : branches.length === 0 ? (
              <p className="text-sm text-slate-600">Aún no hay sucursales creadas.</p>
            ) : (
              <div className="space-y-2">
                {branches.map((b: any) => (
                  <div key={b._id} className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2">
                    {editingBranchId === b._id ? (
                      <div className="space-y-2">
                        <input
                          className="input"
                          value={editingBranchForm.name}
                          onChange={(e) => setEditingBranchForm((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="Nombre"
                        />
                        <input
                          className="input"
                          value={editingBranchForm.address}
                          onChange={(e) => setEditingBranchForm((prev) => ({ ...prev, address: e.target.value }))}
                          placeholder="Dirección"
                        />
                        <input
                          className="input"
                          value={editingBranchForm.phone}
                          onChange={(e) => setEditingBranchForm((prev) => ({ ...prev, phone: e.target.value }))}
                          placeholder="Teléfono"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            className="input"
                            value={editingBranchForm.city}
                            onChange={(e) => setEditingBranchForm((prev) => ({ ...prev, city: e.target.value }))}
                            placeholder="Ciudad"
                          />
                          <input
                            className="input"
                            value={editingBranchForm.province}
                            onChange={(e) => setEditingBranchForm((prev) => ({ ...prev, province: e.target.value }))}
                            placeholder="Provincia"
                          />
                          <input
                            className="input"
                            value={editingBranchForm.postalCode}
                            onChange={(e) => setEditingBranchForm((prev) => ({ ...prev, postalCode: e.target.value }))}
                            placeholder="Código postal"
                          />
                          <input
                            className="input"
                            value={editingBranchForm.country}
                            onChange={(e) => setEditingBranchForm((prev) => ({ ...prev, country: e.target.value }))}
                            placeholder="País"
                          />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 justify-end">
                          <button className="btn-primary !py-1.5 !px-3 w-full sm:w-auto justify-center" onClick={handleUpdateBranch} disabled={updatingBranch}>Guardar</button>
                          <button
                            className="btn-secondary !py-1.5 !px-3 w-full sm:w-auto"
                            onClick={() => {
                              setEditingBranchId(null);
                              setEditingBranchForm({ name: '', address: '', phone: '', city: '', province: '', postalCode: '', country: 'Argentina' });
                            }}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          <BranchLocationWarning branch={b} />
                          <div>
                            <p className="text-sm text-white font-medium">{b.name}</p>
                            <p className="text-xs text-slate-500">{b.address}</p>
                            {(b.city || b.province || b.postalCode) && (
                              <p className="text-xs text-slate-500">
                                {[b.city, b.province, b.postalCode].filter(Boolean).join(', ')}
                                {b.country ? ` · ${b.country}` : ''}
                              </p>
                            )}
                            {b.phone && <p className="text-xs text-slate-500">{b.phone}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            onClick={() => {
                              setEditingBranchId(b._id);
                              setEditingBranchForm({
                                name: b.name || '',
                                address: b.address || '',
                                phone: b.phone || '',
                                city: b.city || '',
                                province: b.province || '',
                                postalCode: b.postalCode || '',
                                country: b.country || 'Argentina',
                              });
                            }}
                            className="btn-icon !text-sky-400 hover:!bg-sky-400/10 hover:!border-sky-400/20"
                            title="Editar sucursal"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Desactivar sucursal "${b.name}"?`)) {
                                deleteBranch(b._id);
                              }
                            }}
                            className="btn-icon !text-red-400 hover:!bg-red-400/10 hover:!border-red-400/20"
                            title="Desactivar sucursal"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="text-white font-semibold">Proveedores</h2>

          <div className="space-y-2">
            <input
              className="input"
              placeholder="Nombre del proveedor"
              value={supplierForm.name}
              onChange={(e) => setSupplierForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Contacto (opcional)"
              value={supplierForm.contactName}
              onChange={(e) => setSupplierForm((prev) => ({ ...prev, contactName: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Email (opcional)"
              value={supplierForm.email}
              onChange={(e) => setSupplierForm((prev) => ({ ...prev, email: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Teléfono (opcional)"
              value={supplierForm.phone}
              onChange={(e) => setSupplierForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
            <button
              className="btn-primary w-full"
              onClick={handleCreateSupplier}
              disabled={creatingSupplier}
            >
              Agregar proveedor
            </button>
          </div>

          <div className="surface rounded-xl p-3 max-h-72 overflow-y-auto">
            {loadingSuppliers ? (
              <p className="text-sm text-slate-500">Cargando proveedores...</p>
            ) : suppliers.length === 0 ? (
              <p className="text-sm text-slate-600">Aún no hay proveedores creados.</p>
            ) : (
              <div className="space-y-2">
                {suppliers.map((s: any) => (
                  <div key={s._id} className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2">
                    {editingSupplierId === s._id ? (
                      <div className="space-y-2">
                        <input
                          className="input"
                          value={editingSupplierForm.name}
                          onChange={(e) => setEditingSupplierForm((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="Nombre"
                        />
                        <input
                          className="input"
                          value={editingSupplierForm.contactName}
                          onChange={(e) => setEditingSupplierForm((prev) => ({ ...prev, contactName: e.target.value }))}
                          placeholder="Contacto"
                        />
                        <input
                          className="input"
                          value={editingSupplierForm.email}
                          onChange={(e) => setEditingSupplierForm((prev) => ({ ...prev, email: e.target.value }))}
                          placeholder="Email"
                        />
                        <input
                          className="input"
                          value={editingSupplierForm.phone}
                          onChange={(e) => setEditingSupplierForm((prev) => ({ ...prev, phone: e.target.value }))}
                          placeholder="Teléfono"
                        />
                        <div className="flex flex-col sm:flex-row gap-2 justify-end">
                          <button className="btn-primary !py-1.5 !px-3 w-full sm:w-auto justify-center" onClick={handleUpdateSupplier} disabled={updatingSupplier}>Guardar</button>
                          <button
                            className="btn-secondary !py-1.5 !px-3 w-full sm:w-auto"
                            onClick={() => {
                              setEditingSupplierId(null);
                              setEditingSupplierForm({ name: '', contactName: '', email: '', phone: '' });
                            }}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <p className="text-sm text-white font-medium">{s.name}</p>
                          {s.contactName && <p className="text-xs text-slate-500">Contacto: {s.contactName}</p>}
                          {s.email && <p className="text-xs text-slate-500">{s.email}</p>}
                          {s.phone && <p className="text-xs text-slate-500">{s.phone}</p>}
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            onClick={() => {
                              setEditingSupplierId(s._id);
                              setEditingSupplierForm({
                                name: s.name || '',
                                contactName: s.contactName || '',
                                email: s.email || '',
                                phone: s.phone || '',
                              });
                            }}
                            className="btn-icon !text-sky-400 hover:!bg-sky-400/10 hover:!border-sky-400/20"
                            title="Editar proveedor"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Desactivar proveedor "${s.name}"?`)) {
                                deleteSupplier(s._id);
                              }
                            }}
                            className="btn-icon !text-red-400 hover:!bg-red-400/10 hover:!border-red-400/20"
                            title="Desactivar proveedor"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
