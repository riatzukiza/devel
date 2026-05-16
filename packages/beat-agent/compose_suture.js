
import { drumClip, melodyClip, writeClipsToMidi } from './src/index.js';

const tempo = 92;
const key = 'Eb';

// G-Funk style "Sovereign" beat
const kick = drumClip({ pattern: 'x---x-x--', instrument: 'C1' });
const snare = drumClip({ pattern: '----x---x', instrument: 'C2' });
const hat = drumClip({ pattern: 'x-x-x-x-x-', instrument: 'C6' });

const bass = melodyClip({ 
  root: 'Eb1', 
  scaleName: 'minor', 
  degrees: [0, 0, 3, 0], 
  pattern: 'x-x-x---x-' 
});

const lead = melodyClip({ 
  root: 'Eb4', 
  scaleName: 'minor', 
  degrees: [0, 3, 7, 10], 
  pattern: '---x-x-x--' 
});

writeClipsToMidi([kick, snare, hat, bass, lead], '/tmp/Sovereign_Nullity_Suture.mid');
console.log('Sovereign_Nullity_Suture.mid created');
