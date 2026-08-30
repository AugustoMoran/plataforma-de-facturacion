import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetStoreCategoriesQuery } from '../../services/ecommerceApi';

const buildCategoryHref = (category: string, subcategory?: string) => {
  const params = new URLSearchParams();
  params.set('category', category);
  if (subcategory) params.set('subcategory', subcategory);
  return `/products?${params.toString()}`;
};

export const StoreCategoryNav: React.FC = () => {
  const { data: categories = [] } = useGetStoreCategoriesQuery();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  if (categories.length === 0) return null;

  const activeCat = categories.find((c) => c.name === activeCategory);

  return (
    <nav
      className="relative z-30 border-b border-blue-300/25 bg-blue-900/50 backdrop-blur-sm"
      aria-label="Categorías de productos"
      onMouseLeave={() => setActiveCategory(null)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ul className="flex items-center gap-0 overflow-x-auto scrollbar-none">
          <li className="flex-shrink-0">
            <Link
              to="/"
              className="block px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold uppercase tracking-wide text-blue-100 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              Inicio
            </Link>
          </li>
          {categories.map((cat) => {
            const hasSubs = (cat.subcategories || []).length > 0;
            const isActive = activeCategory === cat.name;

            return (
              <li
                key={cat._id}
                className="flex-shrink-0"
                onMouseEnter={() => setActiveCategory(cat.name)}
              >
                <Link
                  to={buildCategoryHref(cat.name)}
                  className={`block px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold uppercase tracking-wide transition-colors whitespace-nowrap ${
                    isActive ? 'text-white bg-white/10' : 'text-blue-100 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {cat.name}
                  {hasSubs && (
                    <span className="ml-1 inline-block text-[10px] opacity-70" aria-hidden="true">
                      ▾
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
          <li className="flex-shrink-0">
            <Link
              to="/products?offers=true"
              className="block px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold uppercase tracking-wide text-brand-300 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              Ofertas
            </Link>
          </li>
        </ul>
      </div>

      {activeCat && (activeCat.subcategories || []).length > 0 && (
        <div className="absolute left-0 right-0 top-full bg-white border-b border-blue-200 shadow-xl shadow-blue-950/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex flex-wrap gap-x-10 gap-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-2">
                  {activeCat.name}
                </p>
                <Link
                  to={buildCategoryHref(activeCat.name)}
                  className="text-sm font-semibold text-blue-950 hover:text-brand-600 transition-colors"
                >
                  Ver todo →
                </Link>
              </div>
              <div className="flex flex-wrap gap-x-8 gap-y-2 flex-1">
                {(activeCat.subcategories || []).map((sub) => (
                  <Link
                    key={sub._id}
                    to={buildCategoryHref(activeCat.name, sub.name)}
                    className="text-sm text-blue-900 hover:text-brand-600 hover:underline transition-colors"
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
