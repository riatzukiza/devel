import { drumClip, melodyClip, writeClipsToMidi } from './packages/beat-agent/src/index.js';

const kick = drumClip({ pattern: 'x---x---', instrument: 36 });
const snare = drumClip({ pattern: '--x---x-', instrument: 38 });
const hat = drumClip({ pattern: 'x-x-x-x-', instrument: 42 });
const mel = melodyClip({ root: 'C4', scaleName: 'minor', pattern: 'x-x-xxx-x-x-x-xxx-x' });

writeClipsToMidi([kick, snare, hat, mel], 'beat.mid');
console.log('Wrote beat.mid');
