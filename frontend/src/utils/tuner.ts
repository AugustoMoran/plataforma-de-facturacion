export type InstrumentId = 'guitar' | 'bass4' | 'bass5' | 'ukulele';

export interface TuningString {
  id: string;
  label: string;
  note: string;
  octave: number;
  frequency: number;
}

export const A4_REFERENCE = 440;

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export const frequencyFromMidi = (midi: number, a4 = A4_REFERENCE) =>
  a4 * 2 ** ((midi - 69) / 12);

export const midiFromFrequency = (frequency: number, a4 = A4_REFERENCE) =>
  69 + 12 * Math.log2(frequency / a4);

export const noteNameFromFrequency = (frequency: number, a4 = A4_REFERENCE) => {
  const midi = Math.round(midiFromFrequency(frequency, a4));
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return { name, octave, midi, label: `${name}${octave}` };
};

export const centsBetween = (frequency: number, targetFrequency: number) =>
  1200 * Math.log2(frequency / targetFrequency);

const string = (label: string, note: string, octave: number, id?: string): TuningString => {
  const noteIndex = NOTE_NAMES.indexOf(note as (typeof NOTE_NAMES)[number]);
  const midi = (octave + 1) * 12 + noteIndex;
  return {
    id: id || `${note}${octave}`,
    label,
    note,
    octave,
    frequency: frequencyFromMidi(midi),
  };
};

export const INSTRUMENT_TUNINGS: Record<InstrumentId, { name: string; strings: TuningString[] }> = {
  guitar: {
    name: 'Guitarra',
    strings: [
      string('6ª', 'E', 2, 'guitar-6'),
      string('5ª', 'A', 2, 'guitar-5'),
      string('4ª', 'D', 3, 'guitar-4'),
      string('3ª', 'G', 3, 'guitar-3'),
      string('2ª', 'B', 3, 'guitar-2'),
      string('1ª', 'E', 4, 'guitar-1'),
    ],
  },
  bass4: {
    name: 'Bajo 4 cuerdas',
    strings: [
      string('4ª', 'E', 1, 'bass4-4'),
      string('3ª', 'A', 1, 'bass4-3'),
      string('2ª', 'D', 2, 'bass4-2'),
      string('1ª', 'G', 2, 'bass4-1'),
    ],
  },
  bass5: {
    name: 'Bajo 5 cuerdas',
    strings: [
      string('5ª', 'B', 0, 'bass5-5'),
      string('4ª', 'E', 1, 'bass5-4'),
      string('3ª', 'A', 1, 'bass5-3'),
      string('2ª', 'D', 2, 'bass5-2'),
      string('1ª', 'G', 2, 'bass5-1'),
    ],
  },
  ukulele: {
    name: 'Ukelele',
    strings: [
      string('4ª', 'G', 4, 'uke-4'),
      string('3ª', 'C', 4, 'uke-3'),
      string('2ª', 'E', 4, 'uke-2'),
      string('1ª', 'A', 4, 'uke-1'),
    ],
  },
};

export const findNearestString = (frequency: number, strings: TuningString[]) => {
  let best = strings[0];
  let bestCents = Infinity;

  for (const candidate of strings) {
    const cents = Math.abs(centsBetween(frequency, candidate.frequency));
    if (cents < bestCents) {
      best = candidate;
      bestCents = cents;
    }
  }

  const signedCents = centsBetween(frequency, best.frequency);
  return { string: best, cents: signedCents };
};

export const IN_TUNE_THRESHOLD_CENTS = 5;
export const CLOSE_THRESHOLD_CENTS = 15;
