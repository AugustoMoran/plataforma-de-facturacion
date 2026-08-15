import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { StoreProduct } from '../../services/ecommerceApi';
import { addToCart, setCartOpen } from '../../store/cartSlice';

interface ProductCardProps {
  product: StoreProduct;
  showFeatured?: boolean;
  compact?: boolean;
}

const formatPrice = (value: number) =>
  `$${value.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

export const ProductCard: React.FC<ProductCardProps> = ({ product, showFeatured = true, compact = true }) => {
  const dispatch = useDispatch();
  const productPath = `/products/${product.slug || product._id}`;
  const outOfStock = product.stock <= 0;
  const displayPrice = product.effectivePrice ?? product.price;
  const onSale = product.onSale && product.salePrice != null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;

    dispatch(
      addToCart({
        productId: product._id,
        name: product.name,
        price: displayPrice,
        quantity: 1,
        imageUrl: product.imageUrl,
        slug: product.slug,
        maxStock: product.stock,
      })
    );
    dispatch(setCartOpen(true));
  };

  return (
    <Link
      to={productPath}
      className={`group card p-0 overflow-hidden hover:ring-1 hover:ring-brand-400/40 transition-all hover:shadow-glow-sm flex flex-col ${compact ? 'text-[13px]' : ''}`}
    >
      <div className={`${compact ? 'aspect-[4/5]' : 'aspect-square'} bg-blue-50 relative overflow-hidden`}>
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-blue-300">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {onSale && (
          <span className="absolute top-1.5 left-1.5 badge-red text-[9px] px-1.5 py-0">Oferta</span>
        )}

        {showFeatured && product.featured && (
          <span className="absolute top-1.5 right-1.5 badge-blue text-[9px] px-1.5 py-0">Destacado</span>
        )}

        {outOfStock && (
          <span className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="badge-red text-[10px]">Sin stock</span>
          </span>
        )}
      </div>

      <div className={`${compact ? 'p-2.5' : 'p-4'} flex-1 flex flex-col`}>
        <p className="text-[9px] text-blue-600/70 uppercase tracking-wide mb-0.5 line-clamp-1">
          {product.subcategory ? `${product.category} · ${product.subcategory}` : product.category}
        </p>
        <h3 className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-blue-950 line-clamp-2 min-h-[2rem] leading-snug group-hover:text-brand-700 transition-colors`}>
          {product.name}
        </h3>
        <div className={`mt-auto ${compact ? 'pt-2' : 'pt-3'} flex items-end justify-between gap-1`}>
          <div className="min-w-0">
            {onSale ? (
              <>
                <span className="block text-[10px] text-blue-400 line-through tabular-nums">
                  {formatPrice(product.price)}
                </span>
                <span className="text-sm font-bold text-brand-700 tabular-nums">
                  {formatPrice(displayPrice)}
                </span>
              </>
            ) : (
              <span className="text-sm font-bold text-brand-700 tabular-nums">
                {formatPrice(displayPrice)}
              </span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            className="btn-primary !py-1 !px-2 text-[10px] disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            +
          </button>
        </div>
      </div>
    </Link>
  );
};
