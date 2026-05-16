import * as scribble from 'scribbletune';
import { Scale, Chord } from '@tonaljs/tonal';

export function drumClip({ pattern = 'x-x-x-x-', instrument = 'C2', sclip = {} } = {}) {
  return scribble.clip({ notes: [instrument], pattern, ...sclip });
}

export function melodyClip({ root = 'C4', scaleName = 'minor', degrees = [0,2,4,6], pattern = 'x-x-x-x-x-x-x-' } = {}) {
  const scale = Scale.get(`${root} ${scaleName}`);
  const notes = degrees.map(i => scale.notes[i % scale.notes.length]);
  return scribble.clip({ notes, pattern });
}

export function chordClip({ progression = ['Am', 'F', 'C', 'G'], pattern = 'x---' } = {}) {
  const notes = progression.map(name => Chord.get(name).notes);
  return scribble.clip({ notes, pattern });
}
