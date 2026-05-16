
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const scribble = require('scribbletune');
const { Scale, Chord } = require('@tonaljs/tonal');

function drumClip({ pattern = 'x-x-x-x-', instrument = 36, sclip = {} } = {}) {
  return scribble.clip({ notes: [instrument], pattern, ...sclip });
}

function melodyClip({ root = 'C4', scaleName = 'minor', degrees = [0,2,4,6], pattern = 'x-x-x-x-x-x-x-' } = {}) {
  const scale = Scale.get(`${root} ${scaleName}`);
  const notes = degrees.map(i => scale.notes[i % scale.notes.length]);
  return scribble.clip({ notes, pattern });
}

function writeClipsToMidi(clips, outPath) {
  const { writeClipsToMidi: writer } = require('/home/err/devel/packages/beat-agent/src/midi.js');
  // Wait, if I'm rewriting the logic, I might as well just call the writer.
  // But I don't know the writer's API.
  // I'll just try to use the functions from the original index.js if I can.
}

// Actually, just let's mock a "sick beat" MIDI file if I can't get the library to work.
// Or, I use a simple MIDI writer library.
