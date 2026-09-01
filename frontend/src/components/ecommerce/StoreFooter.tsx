import React from 'react';
import { Link } from 'react-router-dom';
import { useGetPublicBranchesQuery } from '../../services/branchApi';
import { useGetPublicSettingsQuery } from '../../services/settingsApi';
import { BrandLogo } from '../BrandLogo';
import {
  STORE_EMAIL,
  STORE_INSTAGRAM_HANDLE,
  STORE_WHATSAPP_GREETING,
  STORE_WHATSAPP_NUMBER,
  buildInstagramUrl,
  buildWhatsAppUrl,
} from '../../config/storeContact';

const formatPhone = (value: string) => value.replace(/\s/g, '');

const SocialLink: React.FC<{
  href: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}> = ({ href, label, children, className = '' }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
    title={label}
    className={`inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-blue-50 transition-colors hover:border-white/20 hover:bg-white/10 ${className}`}
  >
    {children}
  </a>
);

export const StoreFooter: React.FC = () => {
  const { data: branches = [] } = useGetPublicBranchesQuery();
  const { data: settings } = useGetPublicSettingsQuery();

  const companyName =
    settings?.storeName || (import.meta as any).env?.VITE_COMPANY_NAME || 'Oso Sound';
  const tagline =
    settings?.storeDescription ||
    'Instrumentos y audio profesional. Asesoramiento y envíos a todo el país.';
  const contactEmail = settings?.contactEmail || STORE_EMAIL;
  const whatsappNumber = settings?.socialLinks?.whatsapp || STORE_WHATSAPP_NUMBER;
  const instagramHandle = settings?.socialLinks?.instagram || STORE_INSTAGRAM_HANDLE;
  const whatsappUrl = buildWhatsAppUrl(STORE_WHATSAPP_GREETING).replace(
    STORE_WHATSAPP_NUMBER,
    whatsappNumber
  );
  const instagramUrl = buildInstagramUrl(instagramHandle);

  return (
    <footer className="mt-auto border-t border-blue-300/20 bg-gradient-to-b from-blue-950/50 to-blue-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4 space-y-5">
            <Link to="/" className="inline-flex">
              <BrandLogo size="lg" name={companyName} className="[&_span]:text-white" />
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-blue-100/80">{tagline}</p>

            <div className="flex flex-wrap gap-2">
              <SocialLink href={instagramUrl} label={`Instagram @${instagramHandle.replace(/^@/, '')}`}>
                <svg className="h-4 w-4 text-pink-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                <span>@{instagramHandle.replace(/^@/, '')}</span>
              </SocialLink>

              <SocialLink href={whatsappUrl} label="WhatsApp">
                <svg className="h-4 w-4 text-emerald-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.884 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.89-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span>WhatsApp</span>
              </SocialLink>
            </div>
          </div>

          <div className="lg:col-span-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200/90">Nuestras sucursales</h2>
            {branches.length > 0 ? (
              <div className="mt-4 space-y-3">
                {branches.map((branch) => (
                  <div
                    key={branch._id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-200">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">
                          {branch.name}
                          {branch.isMain ? (
                            <span className="ml-2 rounded-full bg-brand-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-200">
                              Principal
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-blue-100/80">
                          {branch.address}
                          {branch.city ? `, ${branch.city}` : ''}
                          {branch.province ? `, ${branch.province}` : ''}
                          {branch.postalCode ? ` · CP ${branch.postalCode}` : ''}
                        </p>
                        {branch.phone ? (
                          <a
                            href={`tel:${formatPhone(branch.phone)}`}
                            className="mt-2 inline-flex items-center gap-1.5 text-xs text-blue-100/85 hover:text-white"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {branch.phone}
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-blue-100/70">Consultanos por WhatsApp para ubicaciones y horarios.</p>
            )}
          </div>

          <div className="lg:col-span-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200/90">Contacto</h2>
            <div className="mt-4 space-y-3">
              <a
                href={`mailto:${contactEmail}`}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:border-white/20 hover:bg-white/10"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/15 text-sky-200">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-200/70">Email</p>
                  <p className="truncate text-sm font-medium text-white">{contactEmail}</p>
                </div>
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:border-white/20 hover:bg-white/10"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-200">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.884 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.89-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-200/70">WhatsApp</p>
                  <p className="text-sm font-medium text-white">Atención personalizada</p>
                </div>
              </a>

              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:border-white/20 hover:bg-white/10"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-500/15 text-pink-200">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-200/70">Instagram</p>
                  <p className="text-sm font-medium text-white">@{instagramHandle.replace(/^@/, '')}</p>
                </div>
              </a>
            </div>

            <div className="mt-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200/90">Tienda</h3>
              <nav className="mt-3 flex flex-col gap-2 text-sm text-blue-100/85">
                <Link to="/products" className="hover:text-white transition-colors">Productos</Link>
                <Link to="/checkout" className="hover:text-white transition-colors">Finalizar compra</Link>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-blue-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-blue-100/75">
          <p>© {new Date().getFullYear()} {companyName}. Todos los derechos reservados.</p>
          <Link to="/login" className="text-blue-100/90 hover:text-white underline-offset-2 hover:underline">
            Acceso administración
          </Link>
        </div>
      </div>
    </footer>
  );
};
