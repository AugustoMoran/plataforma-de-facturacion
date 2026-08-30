import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/ecommerce/SEO';
import { ProductCard } from '../../components/ecommerce/ProductCard';
import { ProductGridSkeleton } from '../../components/ecommerce/ProductCardSkeleton';
import { HeroCarousel } from '../../components/ecommerce/HeroCarousel';
import { PromoTripletBanner } from '../../components/ecommerce/PromoTripletBanner';
import { PromoSingleBanner } from '../../components/ecommerce/PromoSingleBanner';
import { useGetStoreProductsQuery } from '../../services/ecommerceApi';
import { useGetPublicSettingsQuery } from '../../services/settingsApi';
import { useTrackEventMutation } from '../../services/analyticsApi';

export const StoreHome: React.FC = () => {
  const { data: settings } = useGetPublicSettingsQuery();
  const { data: products = [], isLoading: loadingProducts } = useGetStoreProductsQuery();
  const [trackEvent] = useTrackEventMutation();

  useEffect(() => {
    trackEvent({ event: 'page_view', path: '/' }).catch(() => {});
  }, [trackEvent]);

  const storeName = settings?.storeName || (import.meta as any).env?.VITE_COMPANY_NAME || 'Tienda';
  const bannerImages = settings?.bannerImages || [];
  const promoTripletImages = settings?.promoTripletImages || [];
  const promoBannerImage = settings?.promoBannerImage || '';

  return (
    <div className="animate-slide-up">
      <SEO
        title={storeName}
        description={settings?.storeDescription || 'Instrumentos y audio profesional — comprá online con envío cotizado'}
      />

      <HeroCarousel images={bannerImages} storeName={storeName} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <PromoTripletBanner images={promoTripletImages} />
        <PromoSingleBanner image={promoBannerImage} />

        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Instrumentos publicados</h2>
              <p className="text-sm text-blue-100 mt-1">Catálogo completo de la tienda</p>
            </div>
            <Link to="/products" className="text-sm text-white/90 hover:text-white transition-colors">
              Ver catálogo →
            </Link>
          </div>
          {loadingProducts ? (
            <ProductGridSkeleton count={8} />
          ) : products.length === 0 ? (
            <div className="card p-10 text-center text-slate-600 text-sm">
              No hay productos disponibles en este momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.slice(0, 12).map((p) => (
                <ProductCard key={p._id} product={p} showFeatured={false} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
