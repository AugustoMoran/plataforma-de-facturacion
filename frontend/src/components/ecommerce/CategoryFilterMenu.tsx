import React, { useEffect, useRef, useState } from 'react';
import { StoreCategory } from '../../services/ecommerceApi';

export type CategoryFilterValue =
  | { type: 'all' }
  | { type: 'offers' }
  | { type: 'category'; category: string }
  | { type: 'subcategory'; category: string; subcategory: string };

interface CategoryFilterMenuProps {
  categories: StoreCategory[];
  value: CategoryFilterValue;
  onChange: (value: CategoryFilterValue) => void;
}

const labelForValue = (value: CategoryFilterValue) => {
  if (value.type === 'offers') return 'Ofertas';
  if (value.type === 'subcategory') return `${value.category} › ${value.subcategory}`;
  if (value.type === 'category') return value.category;
  return 'Todas las categorías';
};

export const CategoryFilterMenu: React.FC<CategoryFilterMenuProps> = ({
  categories,
  value,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const [hoverParent, setHoverParent] = useState<string | null>(null);
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setHoverParent(null);
        setExpandedMobile(null);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const pick = (next: CategoryFilterValue) => {
    onChange(next);
    setOpen(false);
    setHoverParent(null);
    setExpandedMobile(null);
  };

  const isSelected = (candidate: CategoryFilterValue) => {
    if (candidate.type !== value.type) return false;
    if (candidate.type === 'all' || candidate.type === 'offers') return true;
    if (candidate.type === 'category' && value.type === 'category') {
      return candidate.category === value.category;
    }
    if (candidate.type === 'subcategory' && value.type === 'subcategory') {
      return candidate.category === value.category && candidate.subcategory === value.subcategory;
    }
    return false;
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="input text-sm text-left flex items-center justify-between gap-2 !py-2.5"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="truncate">{labelForValue(value)}</span>
        <svg
          className={`w-4 h-4 flex-shrink-0 text-blue-700 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[220px] max-h-72 overflow-y-auto rounded-xl border border-blue-200 bg-white shadow-xl shadow-blue-900/15 py-1">
          <button
            type="button"
            className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${isSelected({ type: 'all' }) ? 'bg-blue-100 font-semibold text-blue-950' : 'text-blue-900'}`}
            onClick={() => pick({ type: 'all' })}
          >
            Todas las categorías
          </button>
          <button
            type="button"
            className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${isSelected({ type: 'offers' }) ? 'bg-blue-100 font-semibold text-blue-950' : 'text-blue-900'}`}
            onClick={() => pick({ type: 'offers' })}
          >
            Ofertas
          </button>

          <div className="my-1 border-t border-blue-100" />

          {categories.map((cat) => {
            const subs = cat.subcategories || [];
            const hasSubs = subs.length > 0;
            const parentActive =
              (value.type === 'category' && value.category === cat.name) ||
              (value.type === 'subcategory' && value.category === cat.name);

            return (
              <div
                key={cat._id}
                className="relative"
                onMouseEnter={() => setHoverParent(cat.name)}
                onMouseLeave={() => setHoverParent((prev) => (prev === cat.name ? null : prev))}
              >
                <div className="flex items-stretch">
                  <button
                    type="button"
                    className={`flex-1 text-left px-3 py-2 text-sm hover:bg-blue-50 ${
                      parentActive && value.type === 'category' ? 'bg-blue-100 font-semibold text-blue-950' : 'text-blue-900'
                    }`}
                    onClick={() => pick({ type: 'category', category: cat.name })}
                  >
                    {cat.name}
                  </button>
                  {hasSubs && (
                    <button
                      type="button"
                      className="md:hidden px-2 text-blue-600 hover:bg-blue-50"
                      aria-label={`Ver subcategorías de ${cat.name}`}
                      onClick={() =>
                        setExpandedMobile((prev) => (prev === cat.name ? null : cat.name))
                      }
                    >
                      <svg className={`w-4 h-4 transition-transform ${expandedMobile === cat.name ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>

                {hasSubs && (
                  <>
                    <div
                      className={`hidden md:block absolute left-full top-0 ml-0.5 min-w-[180px] rounded-xl border border-blue-200 bg-white shadow-xl shadow-blue-900/15 py-1 ${
                        hoverParent === cat.name ? '' : 'invisible pointer-events-none'
                      }`}
                    >
                      {subs.map((sub) => (
                        <button
                          key={sub._id}
                          type="button"
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${
                            isSelected({ type: 'subcategory', category: cat.name, subcategory: sub.name })
                              ? 'bg-blue-100 font-semibold text-blue-950'
                              : 'text-blue-900'
                          }`}
                          onClick={() => pick({ type: 'subcategory', category: cat.name, subcategory: sub.name })}
                        >
                          {sub.name}
                        </button>
                      ))}
                    </div>

                    {expandedMobile === cat.name && (
                      <div className="md:hidden pl-3 border-l-2 border-blue-200 ml-3 mb-1">
                        {subs.map((sub) => (
                          <button
                            key={sub._id}
                            type="button"
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${
                              isSelected({ type: 'subcategory', category: cat.name, subcategory: sub.name })
                                ? 'bg-blue-100 font-semibold text-blue-950'
                                : 'text-blue-800'
                            }`}
                            onClick={() => pick({ type: 'subcategory', category: cat.name, subcategory: sub.name })}
                          >
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
