import { drumClip, melodyClip, writeClipsToMidi } from './packages/beat-agent/src/index.js';

const kick = drumClip({ pattern: 'x---x--x-', instrument: 'C2' });
const snare = drumClip({ pattern: '--x---x--', instrument: 'D2' });
const hat = drumClip({ pattern: 'x-x-x-x-', instrument: 'F2' });
const mel = melodyClip({ root: 'Eb3', scaleName: 'major', degrees: [0, 2, 4, 7], pattern: 'x---x-x--' });

writeClipsToMidi([kick, snare, hat, mel], 'Music/Saturated_Stasis_LoFi.mid');
console.log('Generated Music/Saturated_Stasis_LoFi.mid');
