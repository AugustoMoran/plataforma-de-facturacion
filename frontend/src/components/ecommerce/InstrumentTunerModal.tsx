import React, { useEffect } from 'react';
import { InstrumentTuner } from './InstrumentTuner';

interface InstrumentTunerModalProps {
  open: boolean;
  onClose: () => void;
}

export const InstrumentTunerModal: React.FC<InstrumentTunerModalProps> = ({ open, onClose }) => {
  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[35] bg-blue-950/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-label="Cerrar afinador"
      />
      <div
        className="fixed inset-x-0 bottom-0 z-[36] flex max-h-[calc(100dvh-4.25rem)] flex-col animate-slide-up sm:max-h-[calc(100dvh-5rem)]"
        role="dialog"
        aria-modal="true"
        aria-label="Afinador de instrumentos"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden px-3 pb-3 pt-2 sm:px-4 sm:pb-4">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl bg-white shadow-2xl shadow-blue-950/25 ring-1 ring-blue-200/80">
            <div className="relative overflow-hidden border-b border-blue-100 px-4 py-4 sm:px-5">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-700 via-brand-600 to-brand-700 opacity-[0.08]" />
              <div className="relative flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-glow-sm">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 1.5a3 3 0 00-3 3v7a3 3 0 006 0v-7a3 3 0 00-3-3z"
                        />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-700">OsoSound</p>
                      <h2 className="text-lg font-bold text-blue-950 sm:text-xl">Afinador en línea</h2>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">Guitarra, bajo y ukelele con tu micrófono.</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-800 ring-1 ring-blue-200 transition-colors hover:bg-blue-100"
                  aria-label="Cerrar afinador"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-white to-blue-50/40">
              <InstrumentTuner embedded />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
