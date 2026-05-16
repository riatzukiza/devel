
import { drumClip, melodyClip, writeClipsToMidi } from './src/index.js';

const tempo = 120;

// High-fidelity corporate "ping"
// C Major scale: [C, D, E, F, G, A, B]
const mel = melodyClip({ 
    root: 'C4', 
    scaleName: 'major', 
    degrees: [0, 2, 4, 6, 0], // C, E, G, B, C
    pattern: 'x---x-x-x' 
});

// Subtle "laminated" click
const pop = drumClip({ 
    pattern: 'x---x---', 
    instrument: 'C2' 
});

writeClipsToMidi([mel, pop], 'Music/SCLDF_Brand_Identity.mid');
console.log('MIDI generated: Music/SCLDF_Brand_Identity.mid');
