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
        className="fixed inset-0 z-[35] bg-blue-950/55 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Cerrar afinador"
      />
      <div
        className="fixed inset-x-0 bottom-0 z-[36] flex max-h-[calc(100dvh-4.25rem)] flex-col sm:max-h-[calc(100dvh-5rem)]"
        role="dialog"
        aria-modal="true"
        aria-label="Afinador de instrumentos"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden px-3 pb-3 pt-2 sm:px-4 sm:pb-4">
          <div className="card flex min-h-0 flex-1 flex-col overflow-hidden shadow-2xl shadow-blue-950/30">
            <div className="flex items-center justify-between border-b border-blue-100 px-4 py-3 sm:px-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-800">Herramienta</p>
                <h2 className="text-lg font-bold text-blue-950">Afinador en línea</h2>
              </div>
              <button type="button" onClick={onClose} className="btn-icon-sm" aria-label="Cerrar afinador">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <InstrumentTuner embedded />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
