import { drumClip, melodyClip, writeClipsToMidi } from './src/index.js';

const kick = drumClip({ pattern: 'x---x---', instrument: 'C1' });
const snare = drumClip({ pattern: '--x---x-', instrument: 'E1' });
const hat = drumClip({ pattern: 'x-x-x-x-', instrument: 'G1' });
const quack = melodyClip({ root: 'C4', scaleName: 'minor', pattern: 'x-x-xxx-x' });

writeClipsToMidi([kick, snare, hat, quack], '/home/err/devel/Music/Symmetry_Resonance_Pulse.mid');
console.log('MIDI Written to /home/err/devel/Music/Symmetry_Resonance_Pulse.mid');
