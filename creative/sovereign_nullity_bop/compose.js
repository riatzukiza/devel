
import { drumClip, melodyClip, writeClipsToMidi } from '/home/err/devel/packages/beat-agent/src/index.js';

const kick  = drumClip({ pattern: 'x---x---', instrument: 'C1' });
const snare = drumClip({ pattern: '--x---x-', instrument: 'D1' });
const hat   = drumClip({ pattern: 'x-x-x-x-', instrument: 'F#1' });
const mel   = melodyClip({ root: 'C#4', scaleName: 'minor', pattern: 'x-xxx-x-x-x-xxx--' });

writeClipsToMidi([kick, snare, hat, mel], '/home/err/devel/sovereign_nullity_bop/beat.mid');
console.log('MIDI written to /home/err/devel/sovereign_nullity_bop/beat.mid');
