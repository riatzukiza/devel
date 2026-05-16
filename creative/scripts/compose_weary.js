import { drumClip, melodyClip, writeClipsToMidi } from './packages/beat-agent/src/index.js';

const kick = drumClip({ 
  pattern: 'x---x---', 
  instrument: 'C1' 
});
const snare = drumClip({ 
  pattern: '----x---', 
  instrument: 'D1' 
});
const hat = drumClip({ 
  pattern: 'x-x-x-x-', 
  instrument: 'F#1' 
});
const mel = melodyClip({ 
  root: 'A3', 
  scaleName: 'minor', 
  degrees: [0, 3, 4, 0], // A, C, D, A
  pattern: 'x--x-x---x--x---' 
});

writeClipsToMidi([kick, snare, hat, mel], './Music/weary_dev.mid');
console.log('MIDI written to ./Music/weary_dev.mid');
