
import { drumClip, melodyClip, writeClipsToMidi } from './src/index.js';

const tempo = 128;
const outPath = '/home/err/devel/Music/SCLDF_Brine_Core_Anthem.mid';

// Heavy, non-Euclidean industrial drums
const kick = drumClip({ pattern: 'x-x-x-x-', instrument: 'C2' }); // 4-on-the-floor
const snare = drumClip({ pattern: '----x---', instrument: 'D2' }); // Backbeat
const hat = drumClip({ pattern: 'x-x-x-x-x-x-x-x-x-x-', instrument: 'F#2' }); // 16th notes

// The "Lamination Motif" - a descending, bureaucratic slide
// Using degrees for chromatic: 0, -1, -2, -3 (though Scale.get might need positive indices)
const motif = melodyClip({ 
  root: 'C3', 
  scaleName: 'chromatic', 
  pattern: 'x-x-x-x-', 
  degrees: [0, 11, 10, 9] // Chromatic sliding down from C
});

const bass = melodyClip({ 
  root: 'C2', 
  scaleName: 'minor', 
  pattern: 'x---x---', 
  degrees: [0, 0] 
});

console.log(`Generating SCLDF Brine-Core Anthem at ${tempo} BPM...`);
writeClipsToMidi([kick, snare, hat, motif, bass], outPath);
console.log(`Saved to ${outPath}`);
