
import { drumClip, melodyClip, writeClipsToMidi } from '/home/err/devel/packages/beat-agent/src/index.js';

const tempo = 160;
const key = 'C-minor';

const kick = drumClip({ pattern: 'x---x---', instrument: 36 });
const snare = drumClip({ pattern: '--x---x-', instrument: 38 });
const hat = drumClip({ pattern: 'x-x-x-x-', instrument: 42 });
const bass = melodyClip({ root: 'C2', scaleName: 'minor', pattern: 'x--x-x--' });
const lead = melodyClip({ root: 'C4', scaleName: 'minor', pattern: 'x---x-x-x--x-x--' });

writeClipsToMidi([kick, snare, hat, bass, lead], '/home/err/devel/Saturated_Sinfonia_Artifact/beat.mid');
console.log(`Beat generated at /home/err/devel/Saturated_Sinfonia_Artifact/beat.mid with tempo ${tempo} and key ${key}`);
