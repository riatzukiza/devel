
import scribble from 'scribbletune';
import { writeClipsToMidi } from './src/index.js';

const kick = scribble.clip({ notes: ['C2'], pattern: 'x---x---' });
const snare = scribble.clip({ notes: ['D2'], pattern: '--x---x-' });
const hat = scribble.clip({ notes: ['F#2'], pattern: 'x-x-x-x-' });
const bass = scribble.clip({ notes: ['C2', 'Eb2', 'G2', 'Bb2'], pattern: 'x-x-x---' });
const chords = scribble.clip({ notes: [['C3', 'Eb3', 'G3'], ['F3', 'Ab3', 'C4'], ['C3', 'Eb3', 'G3'], ['G2', 'B2', 'D3']], pattern: 'x---' });

writeClipsToMidi([kick, snare, hat, bass, chords], '/tmp/bankrupt.mid');
console.log('MIDI generated at /tmp/bankrupt.mid');
