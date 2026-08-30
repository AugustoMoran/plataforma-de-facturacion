import React from 'react';

interface PromoSingleBannerProps {
  image?: string;
}

export const PromoSingleBanner: React.FC<PromoSingleBannerProps> = ({ image }) => {
  if (!image) return null;

  return (
    <section className="w-full" aria-label="Banner promocional">
      <div className="aspect-[21/7] sm:aspect-[21/6] min-h-[120px] sm:min-h-[160px] overflow-hidden rounded-xl ring-1 ring-blue-200/30 bg-blue-950/20">
        <img
          src={image}
          alt="Banner promocional"
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    </section>
  );
};
