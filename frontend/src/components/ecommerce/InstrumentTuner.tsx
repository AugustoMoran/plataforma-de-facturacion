import React, { useMemo, useState } from 'react';
import {
  CLOSE_THRESHOLD_CENTS,
  INSTRUMENT_TUNINGS,
  IN_TUNE_THRESHOLD_CENTS,
  InstrumentId,
} from '../../utils/tuner';
import { playReferenceTone, useInstrumentTuner } from '../../hooks/useInstrumentTuner';

const INSTRUMENT_OPTIONS = Object.entries(INSTRUMENT_TUNINGS).map(([id, config]) => ({
  id: id as InstrumentId,
  name: config.name,
}));

const formatCents = (cents: number) => {
  const rounded = Math.round(cents);
  if (rounded > 0) return `+${rounded}`;
  return `${rounded}`;
};

const TunerGauge: React.FC<{ cents: number; inTune: boolean; active: boolean }> = ({
  cents,
  inTune,
  active,
}) => {
  const clamped = Math.max(-50, Math.min(50, cents));
  const position = ((clamped + 50) / 100) * 100;

  const statusText = !active
    ? 'Tocá una cuerda cerca del micrófono'
    : inTune
      ? '¡Perfecto! Estás afinado'
      : cents > 0
        ? 'Muy agudo — bajá la afinación'
        : 'Muy grave — subí la afinación';

  const statusClass = !active
    ? 'text-blue-200/80'
    : inTune
      ? 'text-emerald-300'
      : Math.abs(cents) <= CLOSE_THRESHOLD_CENTS
        ? 'text-amber-300'
        : 'text-rose-300';

  return (
    <div className="w-full">
      <div className="relative px-1 pt-2">
        <div className="relative h-3 overflow-hidden rounded-full bg-blue-950/50 ring-1 ring-white/10">
          <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-rose-500/70 via-amber-400/50 to-transparent" />
          <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-rose-500/70 via-amber-400/50 to-transparent" />
          <div className="absolute inset-y-0 left-1/2 w-8 -translate-x-1/2 rounded-full bg-emerald-400/35" />
          <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white/70" />
        </div>

        <div
          className={`absolute top-0 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-white shadow-lg shadow-brand-500/40 transition-all duration-75 ${
            active ? (inTune ? 'bg-emerald-400 scale-110' : 'bg-white') : 'bg-blue-300/40'
          }`}
          style={{ left: `${position}%` }}
        />

        <div className="mt-3 flex justify-between text-[10px] font-semibold uppercase tracking-wider text-blue-200/50">
          <span>Grave</span>
          <span>0 ct</span>
          <span>Agudo</span>
        </div>
      </div>

      <p className={`mt-3 text-center text-sm font-semibold ${statusClass}`}>{statusText}</p>
    </div>
  );
};

const MicIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 1.5a3 3 0 00-3 3v7a3 3 0 006 0v-7a3 3 0 00-3-3z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0M12 18v4m-4 0h8" />
  </svg>
);

export const InstrumentTuner: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const [instrument, setInstrument] = useState<InstrumentId>('guitar');
  const [selectedStringId, setSelectedStringId] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);

  const strings = INSTRUMENT_TUNINGS[instrument].strings;
  const activeStringId = manualMode ? selectedStringId : null;

  const { isListening, reading, error, start, stop } = useInstrumentTuner(instrument, activeStringId);

  const displayNote = useMemo(() => {
    if (!reading) return '—';
    if (manualMode && selectedStringId) {
      const target = strings.find((item) => item.id === selectedStringId);
      return target ? `${target.note}${target.octave}` : reading.detectedLabel;
    }
    return reading.detectedLabel;
  }, [manualMode, reading, selectedStringId, strings]);

  const targetLabel = reading?.targetString
    ? `${reading.targetString.label} · ${reading.targetString.note}${reading.targetString.octave}`
    : 'Esperando señal';

  const handleMicToggle = () => {
    if (isListening) {
      stop();
      return;
    }
    void start();
  };

  const handleInstrumentChange = (next: InstrumentId) => {
    setInstrument(next);
    setSelectedStringId(null);
  };

  return (
    <section className={embedded ? 'p-4 sm:p-5' : 'card p-5 sm:p-6'} aria-label="Afinador de instrumentos">
      {!embedded ? (
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="section-heading">Herramienta OsoSound</p>
            <h2 className="text-xl font-bold text-blue-950">Afinador en línea</h2>
            <p className="mt-1 text-sm text-slate-600">
              Afiná guitarra, bajo o ukelele con el micrófono. Referencia A4 = 440 Hz.
            </p>
          </div>
        </div>
      ) : null}

      <div className={embedded ? 'space-y-4' : 'mt-5 space-y-4'}>
        <div className="flex flex-wrap items-center gap-2">
          {INSTRUMENT_OPTIONS.map((option) => {
            const active = instrument === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleInstrumentChange(option.id)}
                className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-all sm:text-sm ${
                  active
                    ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-glow-sm'
                    : 'bg-blue-50 text-blue-900 ring-1 ring-blue-200 hover:bg-blue-100'
                }`}
              >
                {option.name}
              </button>
            );
          })}
        </div>

        <div className="inline-flex rounded-xl bg-blue-50 p-1 ring-1 ring-blue-200">
          <button
            type="button"
            onClick={() => {
              setManualMode(false);
              setSelectedStringId(null);
            }}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all sm:text-sm ${
              !manualMode ? 'bg-white text-blue-950 shadow-sm' : 'text-blue-700 hover:text-blue-900'
            }`}
          >
            Automático
          </button>
          <button
            type="button"
            onClick={() => setManualMode(true)}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all sm:text-sm ${
              manualMode ? 'bg-white text-blue-950 shadow-sm' : 'text-blue-700 hover:text-blue-900'
            }`}
          >
            Manual
          </button>
        </div>
      </div>

      <div
        className={`relative mt-5 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 p-5 sm:p-6 shadow-glow-md ring-1 ring-white/15 ${
          reading?.inTune ? 'shadow-emerald-500/20' : ''
        }`}
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-brand-400/20 blur-2xl" />

        <div className="relative flex flex-col items-center text-center">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                isListening
                  ? 'bg-white/15 text-white ring-1 ring-white/25'
                  : 'bg-blue-950/30 text-blue-100 ring-1 ring-white/10'
              }`}
            >
              {isListening ? (
                <>
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  Escuchando
                </>
              ) : (
                'Micrófono inactivo'
              )}
            </span>
            {reading?.inTune ? (
              <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-200 ring-1 ring-emerald-300/30">
                Afinado
              </span>
            ) : null}
          </div>

          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-blue-100/80">Nota detectada</p>
          <p
            className={`mt-1 text-6xl font-black tracking-tight tabular-nums sm:text-7xl ${
              reading?.inTune ? 'text-emerald-300 drop-shadow-[0_0_24px_rgba(110,231,183,0.45)]' : 'text-white'
            }`}
          >
            {displayNote}
          </p>

          <p className="mt-2 text-sm text-blue-100/90">
            Objetivo: <span className="font-semibold text-white">{targetLabel}</span>
            {reading ? (
              <span className="ml-2 text-blue-200/80">
                · {reading.frequency.toFixed(1)} Hz · {formatCents(reading.cents)} ct
              </span>
            ) : null}
          </p>

          <div className="mt-6 w-full max-w-lg">
            <TunerGauge cents={reading?.cents ?? 0} inTune={reading?.inTune ?? false} active={Boolean(reading)} />
          </div>

          <p className="mt-4 text-xs text-blue-200/70">
            Tolerancia ±{IN_TUNE_THRESHOLD_CENTS} centavos para considerar afinado.
          </p>
        </div>
      </div>

      <div className="mt-5 flex justify-center">
        <button
          type="button"
          onClick={handleMicToggle}
          className={`relative inline-flex items-center gap-2.5 rounded-2xl px-6 py-3.5 text-sm font-bold transition-all active:scale-[0.98] ${
            isListening
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 hover:bg-rose-600'
              : 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-glow-md hover:from-brand-500 hover:to-brand-600'
          }`}
        >
          {isListening ? (
            <>
              <span className="inline-flex h-2.5 w-2.5 rounded-sm bg-white" />
              Detener micrófono
            </>
          ) : (
            <>
              <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
                <MicIcon className="w-4 h-4" />
                <span className="absolute inset-0 animate-ping rounded-full bg-white/20" />
              </span>
              Activar micrófono
            </>
          )}
        </button>
      </div>

      <div className="mt-6">
        <p className="section-heading">Cuerdas y tono de referencia</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {strings.map((item) => {
            const isSelected = manualMode && selectedStringId === item.id;
            return (
              <div
                key={item.id}
                className={`flex items-center justify-between gap-2 rounded-2xl border p-2.5 transition-all ${
                  isSelected
                    ? 'border-brand-500 bg-gradient-to-r from-brand-50 to-blue-50 shadow-glow-sm'
                    : 'border-blue-100 bg-white hover:border-blue-200 hover:bg-blue-50/50'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (!manualMode) setManualMode(true);
                    setSelectedStringId(item.id);
                  }}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className={`text-[11px] font-semibold uppercase tracking-wide ${isSelected ? 'text-brand-700' : 'text-blue-600'}`}>
                    {item.label}
                  </p>
                  <p className={`text-base font-bold ${isSelected ? 'text-brand-800' : 'text-blue-950'}`}>
                    {item.note}
                    <span className="text-xs font-semibold opacity-70">{item.octave}</span>
                  </p>
                </button>
                <button
                  type="button"
                  aria-label={`Escuchar ${item.note}${item.octave}`}
                  onClick={() => void playReferenceTone(item.frequency)}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    isSelected
                      ? 'bg-brand-600 text-white hover:bg-brand-500'
                      : 'bg-blue-50 text-brand-700 ring-1 ring-blue-200 hover:bg-blue-100'
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H3v6h3l5 4V5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.54 8.46a5 5 0 010 7.07" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      {!isListening && !error ? (
        <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-center text-xs text-blue-800 ring-1 ring-blue-100">
          En celular, tocá &quot;Activar micrófono&quot; y aceptá el permiso. Usá un ambiente silencioso y colocá el
          instrumento cerca del micrófono.
        </p>
      ) : null}
    </section>
  );
};
