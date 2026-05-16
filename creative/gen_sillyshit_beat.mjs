import { drumClip, melodyClip, writeClipsToMidi } from './packages/beat-agent/src/index.js';

// Slow, plodding, "slop" beat
const kick = drumClip({ pattern: 'x---x---x---x---', instrument: 'C2' });
const snare = drumClip({ pattern: '----x-------x---', instrument: 'D2' });
const hat = drumClip({ pattern: 'x-x-x-x-x-x-x-x-', instrument: 'F#3' });

// A pathetic, slightly dissonant bassline (C Minor with some "wrong" notes)
const bass = melodyClip({ root: 'C2', scaleName: 'minor', pattern: 'x---x--x-x---x---' });

// A "sad" melody - slow, repetitive, slightly off
const lead = melodyClip({ root: 'C4', scaleName: 'minor', pattern: '---x-x---x-x--x--' });

writeClipsToMidi([kick, snare, hat, bass, lead], '/home/err/devel/sillyshit_realization.mid');
console.log('MIDI written to /home/err/devel/sillyshit_realization.mid');
