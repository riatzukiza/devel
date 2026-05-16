import { drumClip, melodyClip, writeClipsToMidi } from './src/index.js';

const tempo = 92;
const root = 'A3';
const scaleName = 'minor';

const kick  = drumClip({ pattern: 'x---x---', instrument: 'C2' });
const snare = drumClip({ pattern: '--x---x-', instrument: 'D2' });
const hat   = drumClip({ pattern: 'x-x-x-x-', instrument: 'F#2' });
const mel   = melodyClip({ root, scaleName, pattern: 'x-x-xxx-' });

writeClipsToMidi([kick, snare, hat, mel], '/home/err/devel/sillyshit_failure.mid');

console.log('Sillyshit Failure Score generated at /home/err/devel/sillyshit_failure.mid');
console.log('Tempo:', tempo, 'Key:', root, 'Scale:', scaleName);
