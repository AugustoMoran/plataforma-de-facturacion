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
  const rotation = (clamped / 50) * 42;

  const statusClass = !active
    ? 'text-slate-400'
    : inTune
      ? 'text-emerald-600'
      : Math.abs(cents) <= CLOSE_THRESHOLD_CENTS
        ? 'text-amber-600'
        : 'text-red-600';

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="relative h-28 overflow-hidden">
        <div className="absolute inset-x-6 bottom-0 h-24 rounded-t-full border-[3px] border-blue-200 bg-gradient-to-t from-blue-50 to-white" />
        <div className="absolute left-1/2 bottom-0 h-24 w-0.5 -translate-x-1/2 bg-emerald-500/80" />
        <div className="absolute left-[18%] bottom-2 text-[10px] font-semibold text-slate-400">-50</div>
        <div className="absolute right-[18%] bottom-2 text-[10px] font-semibold text-slate-400">+50</div>
        <div
          className="absolute left-1/2 bottom-0 h-[4.5rem] w-1 origin-bottom rounded-full bg-blue-900 transition-transform duration-75"
          style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
        />
        <div className="absolute left-1/2 bottom-0 h-3 w-3 -translate-x-1/2 rounded-full bg-blue-900 ring-2 ring-white" />
      </div>
      <div className={`mt-2 text-center text-sm font-semibold ${statusClass}`}>
        {!active
          ? 'Tocá una cuerda cerca del micrófono'
          : inTune
            ? '¡Afinado!'
            : cents > 0
              ? 'Muy agudo — bajá la afinación'
              : 'Muy grave — subí la afinación'}
      </div>
    </div>
  );
};

export const InstrumentTuner: React.FC = () => {
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
    : '—';

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
    <section className="card p-5 sm:p-6" aria-label="Afinador de instrumentos">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="section-heading">Herramienta</p>
          <h2 className="text-xl font-bold text-blue-950">Afinador en línea</h2>
          <p className="text-sm text-slate-600 mt-1">
            Afiná guitarra, bajo o ukelele con el micrófono. Referencia A4 = 440 Hz.
          </p>
        </div>

        <button
          type="button"
          onClick={handleMicToggle}
          className={`btn px-5 py-2.5 shrink-0 ${isListening ? 'btn-danger' : 'btn-primary'}`}
        >
          {isListening ? (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              Detener micrófono
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 1.5a3 3 0 00-3 3v7a3 3 0 006 0v-7a3 3 0 00-3-3z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0M12 18v4m-4 0h8" />
              </svg>
              Activar micrófono
            </>
          )}
        </button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="section-heading">Instrumento</span>
          <select
            className="input mt-1"
            value={instrument}
            onChange={(event) => handleInstrumentChange(event.target.value as InstrumentId)}
          >
            {INSTRUMENT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="section-heading">Modo</span>
          <select
            className="input mt-1"
            value={manualMode ? 'manual' : 'auto'}
            onChange={(event) => {
              const isManual = event.target.value === 'manual';
              setManualMode(isManual);
              if (!isManual) setSelectedStringId(null);
            }}
          >
            <option value="auto">Automático (detecta la cuerda)</option>
            <option value="manual">Manual (elegís la cuerda)</option>
          </select>
        </label>
      </div>

      <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 sm:p-6">
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Nota detectada</p>
          <p
            className={`text-5xl sm:text-6xl font-black tracking-tight tabular-nums ${
              reading?.inTune ? 'text-emerald-600' : 'text-blue-950'
            }`}
          >
            {displayNote}
          </p>
          <p className="text-sm text-slate-600">
            Objetivo: <span className="font-semibold text-blue-900">{targetLabel}</span>
            {reading ? (
              <span className="ml-2 text-slate-500">
                · {reading.frequency.toFixed(1)} Hz · {formatCents(reading.cents)} ct
              </span>
            ) : null}
          </p>
        </div>

        <div className="mt-4">
          <TunerGauge cents={reading?.cents ?? 0} inTune={reading?.inTune ?? false} active={Boolean(reading)} />
        </div>

        <p className="mt-3 text-center text-xs text-slate-500">
          Tolerancia ±{IN_TUNE_THRESHOLD_CENTS} centavos para considerar afinado.
        </p>
      </div>

      <div className="mt-5">
        <p className="section-heading">Cuerdas y tono de referencia</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {strings.map((item) => {
            const isSelected = manualMode && selectedStringId === item.id;
            return (
              <div key={item.id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    if (!manualMode) setManualMode(true);
                    setSelectedStringId(item.id);
                  }}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                    isSelected
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-blue-200 bg-white text-blue-900 hover:bg-blue-50'
                  }`}
                >
                  {item.label} {item.note}
                  <span className="text-xs opacity-80">{item.octave}</span>
                </button>
                <button
                  type="button"
                  aria-label={`Escuchar ${item.note}${item.octave}`}
                  onClick={() => void playReferenceTone(item.frequency)}
                  className="btn-icon-sm"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-7-4h.01M5 10h.01M19 10h.01M5 14h.01M19 14h.01"
                    />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      {!isListening && !error ? (
        <p className="mt-4 text-xs text-slate-500">
          En celular, tocá &quot;Activar micrófono&quot; y aceptá el permiso. Usá un ambiente silencioso y colocá el
          instrumento cerca del micrófono.
        </p>
      ) : null}
    </section>
  );
};
