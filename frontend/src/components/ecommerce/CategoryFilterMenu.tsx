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
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    const withSubs = categories.filter((c) => (c.subcategories || []).length > 0).map((c) => c.name);
    if (withSubs.length > 0) {
      setExpandedParents(new Set(withSubs));
    }
  }, [open, categories]);

  useEffect(() => {
    if (value.type === 'subcategory') {
      setExpandedParents((prev) => new Set(prev).add(value.category));
    }
  }, [value]);

  const pick = (next: CategoryFilterValue) => {
    onChange(next);
    setOpen(false);
  };

  const toggleExpanded = (name: string) => {
    setExpandedParents((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
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
        <div className="absolute z-50 mt-1 w-full min-w-[240px] max-h-80 overflow-y-auto rounded-xl border border-blue-200 bg-white shadow-xl shadow-blue-900/15 py-1">
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
            const isExpanded = expandedParents.has(cat.name);
            const parentActive =
              (value.type === 'category' && value.category === cat.name) ||
              (value.type === 'subcategory' && value.category === cat.name);

            return (
              <div key={cat._id} className="border-b border-blue-50 last:border-b-0">
                <div className="flex items-stretch">
                  {hasSubs ? (
                    <button
                      type="button"
                      className="px-2 text-blue-600 hover:bg-blue-50 flex-shrink-0"
                      aria-label={isExpanded ? `Ocultar subcategorías de ${cat.name}` : `Ver subcategorías de ${cat.name}`}
                      onClick={() => toggleExpanded(cat.name)}
                    >
                      <svg
                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ) : (
                    <span className="w-8 flex-shrink-0" />
                  )}
                  <button
                    type="button"
                    className={`flex-1 text-left px-1 py-2 text-sm hover:bg-blue-50 ${
                      parentActive && value.type === 'category'
                        ? 'bg-blue-100 font-semibold text-blue-950'
                        : 'text-blue-900'
                    }`}
                    onClick={() => pick({ type: 'category', category: cat.name })}
                  >
                    {cat.name}
                  </button>
                </div>

                {hasSubs && isExpanded && (
                  <div className="pb-1">
                    {subs.map((sub) => (
                      <button
                        key={sub._id}
                        type="button"
                        className={`w-full text-left pl-10 pr-3 py-2 text-sm hover:bg-blue-50 ${
                          isSelected({ type: 'subcategory', category: cat.name, subcategory: sub.name })
                            ? 'bg-blue-100 font-semibold text-blue-950'
                            : 'text-blue-800'
                        }`}
                        onClick={() => pick({ type: 'subcategory', category: cat.name, subcategory: sub.name })}
                      >
                        ↳ {sub.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
