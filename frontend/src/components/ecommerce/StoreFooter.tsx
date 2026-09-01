import React from 'react';
import { Link } from 'react-router-dom';
import { useGetPublicBranchesQuery } from '../../services/branchApi';

export const StoreFooter: React.FC = () => {
  const { data: branches = [] } = useGetPublicBranchesQuery();
  const companyName = (import.meta as any).env?.VITE_COMPANY_NAME || 'Tienda';

  return (
    <footer className="border-t border-blue-300/25 py-8 mt-auto bg-blue-950/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {branches.length > 0 ? (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-white text-center sm:text-left">Nuestras sucursales</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {branches.map((branch) => (
                <div
                  key={branch._id}
                  className="rounded-2xl border border-blue-300/20 bg-blue-950/30 p-4 text-left"
                >
                  <p className="text-sm font-semibold text-white">
                    {branch.name}
                    {branch.isMain ? (
                      <span className="ml-2 rounded-full bg-brand-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-200">
                        Principal
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-blue-100/85">
                    {branch.address}
                    {branch.city ? `, ${branch.city}` : ''}
                    {branch.province ? `, ${branch.province}` : ''}
                    {branch.postalCode ? ` (CP ${branch.postalCode})` : ''}
                  </p>
                  {branch.phone ? (
                    <p className="mt-2 text-xs text-blue-100/80">
                      Tel:{' '}
                      <a href={`tel:${branch.phone.replace(/\s/g, '')}`} className="hover:text-white">
                        {branch.phone}
                      </a>
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="text-center text-xs text-blue-100/80 space-y-2">
          <p>© {new Date().getFullYear()} {companyName}. Todos los derechos reservados.</p>
          <p>
            <Link to="/login" className="text-white/90 hover:text-white underline-offset-2 hover:underline">
              Acceso administración
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
};
