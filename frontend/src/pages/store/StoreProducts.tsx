import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SEO } from '../../components/ecommerce/SEO';
import { ProductCard } from '../../components/ecommerce/ProductCard';
import { ProductGridSkeleton } from '../../components/ecommerce/ProductCardSkeleton';
import { useGetStoreProductsPageQuery, useGetStoreCategoriesQuery, StoreProduct } from '../../services/ecommerceApi';
import { useTrackEventMutation } from '../../services/analyticsApi';

const PAGE_SIZE = 16;

type SortOption = '' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'newest';

export const StoreProducts: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const category = searchParams.get('category') || '';
  const subcategory = searchParams.get('subcategory') || '';
  const featuredOnly = searchParams.get('featured') === 'true';
  const offersOnly = searchParams.get('offers') === 'true';
  const sort = (searchParams.get('sort') || '') as SortOption;
  const searchTerm = searchParams.get('search') || undefined;

  const [page, setPage] = useState(1);
  const [allProducts, setAllProducts] = useState<StoreProduct[]>([]);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const filtersKey = `${searchTerm || ''}|${category}|${subcategory}|${featuredOnly}|${offersOnly}|${sort}`;

  useEffect(() => {
    setPage(1);
    setAllProducts([]);
  }, [filtersKey]);

  const { data, isLoading, isFetching } = useGetStoreProductsPageQuery({
    search: searchTerm,
    category: category || undefined,
    subcategory: subcategory || undefined,
    featured: featuredOnly || undefined,
    offers: offersOnly || undefined,
    sort: sort || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const { data: categories = [] } = useGetStoreCategoriesQuery();
  const [trackEvent] = useTrackEventMutation();

  useEffect(() => {
    trackEvent({ event: 'page_view', path: '/products' }).catch(() => {});
  }, [trackEvent]);

  useEffect(() => {
    if (!data?.items) return;
    setAllProducts((prev) => {
      if (page === 1) return data.items;
      const existing = new Set(prev.map((p) => p._id));
      const merged = [...prev];
      data.items.forEach((item) => {
        if (!existing.has(item._id)) merged.push(item);
      });
      return merged;
    });
  }, [data, page]);

  const hasMore = data ? page < data.pagination.pages : false;

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasMore || isFetching) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setPage((p) => p + 1);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isFetching, allProducts.length]);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.name === category),
    [categories, category]
  );

  const subcategoryOptions = selectedCategory?.subcategories || [];

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === 'category') next.delete('subcategory');
    setSearchParams(next);
  };

  const applySearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('search', search.trim());
  };

  const showInitialLoading = isLoading && page === 1 && allProducts.length === 0;

  return (
    <div className="space-y-6 animate-slide-up">
      <SEO title="Productos" description="Catálogo completo de productos Oso Sound" />

      <div>
        <h1 className="page-title">Productos</h1>
        <p className="page-sub">
          Explorá nuestro catálogo
          {data?.pagination?.total ? (
            <span> · {data.pagination.total} productos</span>
          ) : null}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <form onSubmit={applySearch} className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            className="input pl-12"
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <select className="input text-sm" value={category} onChange={(e) => updateParam('category', e.target.value)}>
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c._id} value={c.name}>{c.name}</option>
            ))}
          </select>

          <select
            className="input text-sm"
            value={subcategory}
            onChange={(e) => updateParam('subcategory', e.target.value)}
            disabled={!category || subcategoryOptions.length === 0}
          >
            <option value="">Subcategoría</option>
            {subcategoryOptions.map((s) => (
              <option key={s._id} value={s.name}>{s.name}</option>
            ))}
          </select>

          <select className="input text-sm" value={sort} onChange={(e) => updateParam('sort', e.target.value)}>
            <option value="">Ordenar</option>
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
            <option value="name_asc">Nombre: A → Z</option>
            <option value="name_desc">Nombre: Z → A</option>
            <option value="newest">Más recientes</option>
          </select>

          <label className="input text-sm flex items-center gap-2 cursor-pointer !py-2">
            <input
              type="checkbox"
              checked={offersOnly}
              onChange={(e) => updateParam('offers', e.target.checked ? 'true' : '')}
              className="rounded border-blue-300 text-brand-600 focus:ring-brand-500"
            />
            Solo ofertas
          </label>
        </div>
      </div>

      {featuredOnly && <span className="badge-blue">Destacados</span>}

      {showInitialLoading ? (
        <ProductGridSkeleton count={8} />
      ) : allProducts.length === 0 ? (
        <div className="card p-12 text-center text-blue-700/60 text-sm">
          No se encontraron productos con los filtros seleccionados.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {allProducts.map((p) => (
              <ProductCard key={p._id} product={p} compact />
            ))}
          </div>

          <div ref={loadMoreRef} className="py-6 flex justify-center">
            {isFetching && hasMore && (
              <div className="flex items-center gap-2 text-sm text-blue-700/60">
                <span className="w-4 h-4 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
                Cargando más productos...
              </div>
            )}
            {!hasMore && allProducts.length > 0 && (
              <p className="text-xs text-blue-600/60">Mostraste todos los productos</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};
