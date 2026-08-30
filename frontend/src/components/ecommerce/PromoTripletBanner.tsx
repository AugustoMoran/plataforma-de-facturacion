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
            className={`${tileClassName} group relative w-full cursor-pointer border-0 p-0 text-left transition-transform duration-200 hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80`}
            aria-label="Abrir afinador de instrumentos"
          >
            <img
              src={tunerImage}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-900/55 to-blue-800/25 transition-colors group-hover:from-blue-950/95 group-hover:via-blue-900/65" />
            <div className="relative flex h-full flex-col items-center justify-end p-2 sm:p-4 text-center">
              <div className="mb-2 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30 backdrop-blur-sm">
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
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em] text-white/90">Afinador</p>
              <p className="mt-0.5 text-xs sm:text-sm font-semibold text-white">Tocá para abrir</p>
            </div>
          </button>
        </div>
      </section>

      <InstrumentTunerModal open={tunerOpen} onClose={() => setTunerOpen(false)} />
    </>
  );
};
