import React, { useEffect, useState } from 'react';

interface HeroCarouselProps {
  images: string[];
  storeName: string;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ images, storeName }) => {
  const slides = images.length > 0 ? images : [];
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const goTo = (index: number) => setActiveIndex(index);
  const prev = () => setActiveIndex((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setActiveIndex((i) => (i + 1) % slides.length);

  return (
    <section className="relative w-full overflow-hidden aspect-[21/6] sm:aspect-[21/5] min-h-[140px] sm:min-h-[180px] max-h-[280px]">
      {slides.map((url, index) => (
        <div
          key={`${url}-${index}`}
          className={`absolute inset-0 transition-opacity duration-700 ${index === activeIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <img
            src={url}
            alt={`${storeName} — slide ${index + 1}`}
            className="w-full h-full object-cover"
            loading={index === 0 ? 'eager' : 'lazy'}
          />
        </div>
      ))}

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-blue-950/50 hover:bg-blue-950/70 text-white flex items-center justify-center backdrop-blur transition-colors"
            aria-label="Anterior"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-blue-950/50 hover:bg-blue-950/70 text-white flex items-center justify-center backdrop-blur transition-colors"
            aria-label="Siguiente"
          >
            ›
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goTo(index)}
                className={`h-1.5 rounded-full transition-all ${index === activeIndex ? 'w-5 bg-brand-400' : 'w-1.5 bg-white/50 hover:bg-white/80'}`}
                aria-label={`Ir al slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};
