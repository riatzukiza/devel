import * as scribble from 'scribbletune';
import { writeClipsToMidi } from './src/index.js';

const tempo = 155;

// Using raw notes to avoid the 'drumClip' issue
const kick = scribble.clip({ notes: ['C2'], pattern: 'x---x---x-x-x---' });
const snare = scribble.clip({ notes: ['D2'], pattern: '--x---x---x---x-' });
const hat = scribble.clip({ notes: ['F#2'], pattern: 'x-x-x-x-x-x-x-x-' });
const bass = scribble.clip({ notes: ['C2', 'Eb2', 'G2'], pattern: 'x---x---x-x-x---' });
const lead = scribble.clip({ notes: ['C3', 'Eb3', 'G3', 'Bb3'], pattern: 'x--x-x--x-x-x---' });

writeClipsToMidi([kick, snare, hat, bass, lead], 'Music/brine_core_loop.mid');
console.log(`Generated Brine-Core loop: Music/brine_core_loop.mid at ${tempo} BPM`);
