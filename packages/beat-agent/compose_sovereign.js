import { drumClip, melodyClip, writeClipsToMidi } from './src/index.js';

const kick  = drumClip({ pattern: 'x---x---', instrument: 'C1' });
const snare = drumClip({ pattern: '----x---', instrument: 'E2' });
const hat   = drumClip({ pattern: 'x-x-x-x-', instrument: 'G#4' });
const mel   = melodyClip({ root: 'C#3', scaleName: 'minor', degrees: [0, 3, 2, 0], pattern: 'x-x-xxx-' });

writeClipsToMidi([kick, snare, hat, mel], '/tmp/sovereign_thermal_apotheosis.mid');
console.log('Sovereign Beat Composed: /tmp/sovereign_thermal_apotheosis.mid');

