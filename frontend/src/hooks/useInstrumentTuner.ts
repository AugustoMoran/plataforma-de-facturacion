import { useCallback, useEffect, useRef, useState } from 'react';
import { PitchDetector } from 'pitchy';
import {
  A4_REFERENCE,
  centsBetween,
  findNearestString,
  INSTRUMENT_TUNINGS,
  IN_TUNE_THRESHOLD_CENTS,
  InstrumentId,
  noteNameFromFrequency,
  TuningString,
} from '../utils/tuner';

const BUFFER_SIZE = 8192;
const MIN_VOLUME_DB = -50;
const SMOOTHING = 0.28;
const MAX_DISPLAY_CENTS = 50;

const clarityThresholdFor = (frequency: number) => {
  if (frequency < 70) return 0.72;
  if (frequency < 120) return 0.78;
  return 0.84;
};

export interface TunerReading {
  frequency: number;
  clarity: number;
  detectedLabel: string;
  targetString: TuningString;
  cents: number;
  inTune: boolean;
  volumeDb: number;
}

const computeRmsDb = (buffer: Float32Array) => {
  let sum = 0;
  for (let i = 0; i < buffer.length; i += 1) {
    sum += buffer[i] * buffer[i];
  }
  const rms = Math.sqrt(sum / buffer.length);
  return 20 * Math.log10(Math.max(rms, 1e-8));
};

export const useInstrumentTuner = (instrument: InstrumentId, selectedStringId: string | null) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState<TunerReading | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<PitchDetector<Float32Array> | null>(null);
  const bufferRef = useRef<Float32Array | null>(null);
  const rafRef = useRef<number | null>(null);
  const smoothedFrequencyRef = useRef(0);
  const smoothedCentsRef = useRef(0);
  const hasSmoothedRef = useRef(false);

  const strings = INSTRUMENT_TUNINGS[instrument].strings;

  const stop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      void audioContextRef.current.close();
    }
    audioContextRef.current = null;
    analyserRef.current = null;
    detectorRef.current = null;
    bufferRef.current = null;
    smoothedFrequencyRef.current = 0;
    smoothedCentsRef.current = 0;
    hasSmoothedRef.current = false;
    setIsListening(false);
    setReading(null);
  }, []);

  const analyze = useCallback(() => {
    const analyser = analyserRef.current;
    const detector = detectorRef.current;
    const buffer = bufferRef.current;
    const audioContext = audioContextRef.current;

    if (!analyser || !detector || !buffer || !audioContext) return;

    analyser.getFloatTimeDomainData(buffer);
    const volumeDb = computeRmsDb(buffer);
    const [pitch, clarity] = detector.findPitch(buffer, audioContext.sampleRate);

    const minClarity = pitch > 0 ? clarityThresholdFor(pitch) : 0.84;

    if (pitch > 0 && clarity >= minClarity && volumeDb >= MIN_VOLUME_DB) {
      const harmonicPitch = pitch;
      let resolvedPitch = harmonicPitch;

      // Corregir detección de armónicos en graves (octava arriba)
      const candidates = [harmonicPitch, harmonicPitch / 2, harmonicPitch / 3, harmonicPitch / 4];
      const targetStrings = strings;
      let bestCandidate = harmonicPitch;
      let bestScore = Infinity;

      for (const candidate of candidates) {
        if (candidate < 24 || candidate > 1400) continue;
        const nearest = findNearestString(candidate, targetStrings);
        const harmonicPenalty =
          candidate === harmonicPitch ? 0 : Math.abs(Math.log2(harmonicPitch / candidate)) * 8;
        const score = Math.abs(nearest.cents) + harmonicPenalty - clarity * 5;
        if (score < bestScore) {
          bestScore = score;
          bestCandidate = candidate;
        }
      }

      resolvedPitch = bestCandidate;

      if (smoothedFrequencyRef.current === 0) {
        smoothedFrequencyRef.current = resolvedPitch;
      } else {
        smoothedFrequencyRef.current =
          smoothedFrequencyRef.current * (1 - SMOOTHING) + resolvedPitch * SMOOTHING;
      }

      const detected = noteNameFromFrequency(smoothedFrequencyRef.current, A4_REFERENCE);
      const manualTarget = selectedStringId
        ? strings.find((item) => item.id === selectedStringId) || null
        : null;
      const match = manualTarget
        ? {
            string: manualTarget,
            cents: centsBetween(smoothedFrequencyRef.current, manualTarget.frequency),
          }
        : findNearestString(smoothedFrequencyRef.current, strings);

      if (!hasSmoothedRef.current) {
        smoothedCentsRef.current = match.cents;
        hasSmoothedRef.current = true;
      } else {
        smoothedCentsRef.current =
          smoothedCentsRef.current * (1 - SMOOTHING) + match.cents * SMOOTHING;
      }

      const cents = Math.max(-MAX_DISPLAY_CENTS, Math.min(MAX_DISPLAY_CENTS, smoothedCentsRef.current));

      setReading({
        frequency: smoothedFrequencyRef.current,
        clarity,
        detectedLabel: detected.label,
        targetString: match.string,
        cents,
        inTune: Math.abs(cents) <= IN_TUNE_THRESHOLD_CENTS,
        volumeDb,
      });
    } else {
      smoothedFrequencyRef.current = 0;
      smoothedCentsRef.current = 0;
      hasSmoothedRef.current = false;
      setReading(null);
    }

    rafRef.current = requestAnimationFrame(analyze);
  }, [selectedStringId, strings]);

  const start = useCallback(async () => {
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Tu navegador no permite usar el micrófono para afinar.');
      return;
    }

    try {
      stop();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const audioContext = new AudioContext();
      await audioContext.resume();

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = BUFFER_SIZE;
      analyser.smoothingTimeConstant = 0.2;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const detector = PitchDetector.forFloat32Array(BUFFER_SIZE);
      detector.clarityThreshold = 0.72;
      detector.minVolumeDecibels = MIN_VOLUME_DB;

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      mediaStreamRef.current = stream;
      detectorRef.current = detector;
      bufferRef.current = new Float32Array(BUFFER_SIZE);

      setIsListening(true);
      rafRef.current = requestAnimationFrame(analyze);
    } catch (err: any) {
      const message =
        err?.name === 'NotAllowedError'
          ? 'Necesitamos permiso del micrófono para afinar. Permitilo en el navegador e intentá de nuevo.'
          : 'No pudimos acceder al micrófono. Probá con otro dispositivo o navegador.';
      setError(message);
      stop();
    }
  }, [analyze, stop]);

  useEffect(() => () => stop(), [stop]);

  useEffect(() => {
    smoothedFrequencyRef.current = 0;
    smoothedCentsRef.current = 0;
    hasSmoothedRef.current = false;
    setReading(null);
  }, [instrument, selectedStringId]);

  return {
    isListening,
    reading,
    error,
    start,
    stop,
  };
};

export const playReferenceTone = async (frequency: number) => {
  const audioContext = new AudioContext();
  await audioContext.resume();

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = 'triangle';
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.0001;

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  const now = audioContext.currentTime;
  gain.gain.exponentialRampToValueAtTime(0.22, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

  oscillator.start(now);
  oscillator.stop(now + 1.85);

  oscillator.onended = () => {
    void audioContext.close();
  };
};
