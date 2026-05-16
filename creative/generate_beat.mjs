
import { drumClip, melodyClip, writeClipsToMidi } from './packages/beat-agent/src/index.js';

const tempo = 160;
const key = 'C#';
const scale = 'minor';

const kick  = drumClip({ pattern: 'x---x---', instrument: 'C2' });
const snare = drumClip({ pattern: '--x---x-', instrument: 'D2' });
const hat   = drumClip({ pattern: 'x-x-x-x-', instrument: 'F#2' });
const mel   = melodyClip({ root: 'C#3', scaleName: 'minor', pattern: 'x-x-xxx-x-x-xxx-' });

writeClipsToMidi([kick, snare, hat, mel], './nullity_beat.mid');
console.log('Beat generated: nullity_beat.mid');
