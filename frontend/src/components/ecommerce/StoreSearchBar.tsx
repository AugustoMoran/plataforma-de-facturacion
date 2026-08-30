import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface StoreSearchBarProps {
  className?: string;
  compact?: boolean;
}

export const StoreSearchBar: React.FC<StoreSearchBarProps> = ({ className = '', compact = false }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      navigate('/products');
      return;
    }
    navigate(`/products?search=${encodeURIComponent(trimmed)}`);
  };

  return (
    <form onSubmit={handleSubmit} className={`flex w-full ${className}`}>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="¿Qué estás buscando?"
        className={`flex-1 min-w-0 bg-white text-blue-950 placeholder:text-blue-400/70 border border-blue-200/80 focus:outline-none focus:ring-2 focus:ring-brand-400/60 ${
          compact ? 'rounded-l-lg px-3 py-2 text-sm' : 'rounded-l-xl px-4 py-2.5 text-sm sm:text-base'
        }`}
        aria-label="Buscar productos"
      />
      <button
        type="submit"
        className={`flex-shrink-0 bg-brand-500 hover:bg-brand-400 text-blue-950 font-semibold transition-colors ${
          compact ? 'rounded-r-lg px-3 py-2' : 'rounded-r-xl px-4 py-2.5'
        }`}
        aria-label="Buscar"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </form>
  );
};
