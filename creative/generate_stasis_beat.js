import { drumClip, melodyClip, writeClipsToMidi } from 'packages/beat-agent/src/index.js';

const kick = drumClip({ pattern: 'x---x--x-', instrument: 36 });
const snare = drumClip({ pattern: '--x---x--', instrument: 38 });
const hat = drumClip({ pattern: 'x-x-x-x-', instrument: 42 });
const mel = melodyClip({ root: 'Eb3', scaleName: 'major', pattern: 'x---x-x--' });

writeClipsToMidi([kick, snare, hat, mel], 'Music/Saturated_Stasis_LoFi.mid');
console.log('Generated Music/Saturated_Stasis_LoFi.mid');
