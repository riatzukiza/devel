
import { drumClip, melodyClip, writeClipsToMidi } from './src/index.js';
import fs from 'fs';
import path from 'path';

const outPath = 'Music/BrineCore_ZombieDividend.mid';

const kick = drumClip({ 
    pattern: 'x---x-x-', 
    instrument: 'C1' 
});
const snare = drumClip({ 
    pattern: '--x---x-', 
    instrument: 'E2' 
});
const hat = drumClip({ 
    pattern: 'x-x-x-x-', 
    instrument: 'G#5' 
});
const bass = melodyClip({ 
    root: 'F#1', 
    scaleName: 'minor', 
    degrees: [0], 
    pattern: 'x-x-x---' 
});
const pluck = melodyClip({ 
    root: 'F#4', 
    scaleName: 'minor', 
    degrees: [0, 2, 3], 
    pattern: '---x-x--' 
});

writeClipsToMidi([kick, snare, hat, bass, pluck], outPath);
console.log(`MIDI written to ${outPath}`);
