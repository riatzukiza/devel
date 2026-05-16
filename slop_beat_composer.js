import { drumClip, melodyClip, chordClip } from './src/compose.js';
import { writeClipsToMidi } from './src/midi.js';
import fs from 'fs';

const beats = {
  drums: drumClip({ pattern: 'x-x-x--x-x--x-x-x-x-x--x-x-x-x-' }),
  melody: melodyClip({ 
    root: 'C4', 
    scaleName: 'major', 
    degrees: [0, 1, 3, 4, 6, 7, 10, 11], // Chromatic slop
    pattern: 'x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-' 
  }),
  chords: chordClip({ 
    progression: ['Cmaj7', 'F#dim', 'Bb7', 'G#aug'], 
    pattern: 'x---x---x---x---' 
  })
};

const midiPath = '/tmp/slop_beat.mid';
writeClipsToMidi(beats, midiPath)
  .then(() => console.log(`Slop-beat successfully rendered to ${midiPath}`))
  .catch(err => console.error(`Error rendering slop-beat: ${err}`));
