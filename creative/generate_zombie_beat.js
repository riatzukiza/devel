import { drumClip, melodyClip, writeClipsToMidi } from './packages/beat-agent/src/index.js';

const kick  = drumClip({ pattern: 'x---x-x-', instrument: 'C1' });
const snare = drumClip({ pattern: '----x---', instrument: 'D1' });
const hat   = drumClip({ pattern: 'x-x-x-x-', instrument: 'F#1' });
const glitchedMelody = melodyClip({ root: 'C#3', scaleName: 'minor', degrees: [0, 1, 3, 6], pattern: 'x-xx-x--x-x-xx--' });
const highMelody = melodyClip({ root: 'C#4', scaleName: 'minor', degrees: [0, 2, 4, 7], pattern: '--x-x---x---x---' });

writeClipsToMidi([kick, snare, hat, glitchedMelody, highMelody], '/tmp/zombie_beat.mid');
console.log('MIDI generated at /tmp/zombie_beat.mid');
