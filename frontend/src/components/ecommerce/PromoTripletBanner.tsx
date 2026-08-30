import React from 'react';

interface PromoTripletBannerProps {
  images: string[];
}

export const PromoTripletBanner: React.FC<PromoTripletBannerProps> = ({ images }) => {
  const validImages = (images || []).filter(Boolean).slice(0, 3);
  if (validImages.length === 0) return null;

  return (
    <section className="w-full" aria-label="Promociones">
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {validImages.map((url, index) => (
          <div
            key={`${url}-${index}`}
            className="aspect-[4/5] sm:aspect-[4/3] overflow-hidden rounded-lg sm:rounded-xl ring-1 ring-blue-200/30 bg-blue-950/20"
          >
            <img
              src={url}
              alt={`Promoción ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </section>
  );
};
