import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface HeroCarouselProps {
  images: string[];
  storeName: string;
  storeDescription?: string;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ images, storeName, storeDescription }) => {
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

  const description =
    storeDescription || 'Instrumentos, audio y accesorios para músicos de todos los niveles.';

  return (
    <section className="relative overflow-hidden rounded-3xl card-lg flex flex-col sm:block sm:aspect-[21/9] sm:min-h-[360px]">
      {/* Imagen: en móvil se ve completa (contain); en desktop cubre el hero (cover) */}
      <div className="relative w-full aspect-[4/3] sm:absolute sm:inset-0 sm:aspect-auto bg-blue-950/40">
        {slides.map((url, index) => (
          <div
            key={`${url}-${index}`}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === activeIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <img
              src={url}
              alt={`${storeName} — slide ${index + 1}`}
              className="w-full h-full object-contain sm:object-cover sm:object-center"
              loading={index === 0 ? 'eager' : 'lazy'}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 via-blue-950/20 to-transparent sm:bg-gradient-to-r sm:from-[#030712]/90 sm:via-[#030712]/50 sm:to-transparent" />
          </div>
        ))}

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur transition-colors"
              aria-label="Anterior"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur transition-colors"
              aria-label="Siguiente"
            >
              ›
            </button>
            <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => goTo(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === activeIndex ? 'w-6 bg-brand-400' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Ir al slide ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Texto: debajo en móvil, superpuesto en desktop */}
      <div className="relative z-10 flex flex-col justify-center p-5 sm:absolute sm:inset-0 sm:p-12 max-w-2xl">
        <p className="text-brand-600 sm:text-brand-400 text-xs sm:text-sm font-semibold mb-1 sm:mb-2 tracking-wide uppercase">
          Bienvenido
        </p>
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-blue-950 sm:text-white tracking-tight mb-2 sm:mb-4">
          {storeName}
        </h1>
        <p className="text-blue-800 sm:text-slate-300 text-sm sm:text-lg mb-5 sm:mb-8 leading-relaxed line-clamp-3">
          {description}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/products" className="btn-primary">
            Ver catálogo
          </Link>
          <a href="#destacados" className="btn-secondary">
            Destacados
          </a>
        </div>
      </div>
    </section>
  );
};
