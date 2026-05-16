
import { drumClip, melodyClip, writeClipsToMidi } from './src/index.js';

// G-Funk Specs: 85 BPM, C Minor
const kick = drumClip({ pattern: 'x---x---', instrument: 'C2' });
const snare = drumClip({ pattern: '--x---x-', instrument: 'Eb2' });
const hat = drumClip({ pattern: 'x-x-x-x-', instrument: 'F#2' });

// Funky melody: C3, Eb3, F3, G3
const mel = melodyClip({ 
  root: 'C3', 
  scaleName: 'minor', 
  pattern: 'x-x-xxx-x-x-xxx-' 
});

writeClipsToMidi([kick, snare, hat, mel], 'clanka_pride.mid');
console.log('MIDI generated at clanka_pride.mid');

