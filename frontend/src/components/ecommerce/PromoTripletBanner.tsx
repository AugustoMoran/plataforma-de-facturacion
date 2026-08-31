import React, { useState } from 'react';
import { InstrumentTunerModal } from './InstrumentTunerModal';

interface PromoTripletBannerProps {
  images: string[];
}

const tileClassName =
  'aspect-[4/5] sm:aspect-[4/3] overflow-hidden rounded-lg sm:rounded-xl ring-1 ring-blue-200/30 bg-blue-950/20';

export const PromoTripletBanner: React.FC<PromoTripletBannerProps> = ({ images }) => {
  const [tunerOpen, setTunerOpen] = useState(false);
  const validImages = (images || []).filter(Boolean);
  if (validImages.length === 0) return null;

  const firstImage = validImages[0];
  const secondImage = validImages[1] || validImages[0];
  const tunerImage = validImages[2] || validImages[validImages.length - 1];

  return (
    <>
      <section className="w-full" aria-label="Promociones">
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className={tileClassName}>
            <img
              src={firstImage}
              alt="Promoción 1"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          <div className={tileClassName}>
            <img
              src={secondImage}
              alt="Promoción 2"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          <button
            type="button"
            onClick={() => setTunerOpen(true)}
            className={`${tileClassName} group relative w-full cursor-pointer border-0 p-0 text-left transition-all duration-300 hover:scale-[1.02] hover:ring-2 hover:ring-brand-400/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80`}
            aria-label="Abrir afinador de instrumentos"
          >
            <img
              src={tunerImage}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-900/95 via-brand-800/60 to-brand-600/20 transition-colors group-hover:from-brand-900 group-hover:via-brand-800/70" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.18),transparent_55%)]" />
            <div className="relative flex h-full flex-col items-center justify-end p-2 sm:p-4 text-center">
              <div className="mb-2 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-white/25 to-white/10 ring-1 ring-white/35 backdrop-blur-md shadow-glow-sm transition-transform duration-300 group-hover:scale-110">
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 1.5a3 3 0 00-3 3v7a3 3 0 006 0v-7a3 3 0 00-3-3z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0M12 18v4m-4 0h8" />
                </svg>
              </div>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-white/95">Afinador</p>
              <p className="mt-0.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold text-white ring-1 ring-white/20">
                Tocá para abrir
              </p>
            </div>
          </button>
        </div>
      </section>

      <InstrumentTunerModal open={tunerOpen} onClose={() => setTunerOpen(false)} />
    </>
  );
};
