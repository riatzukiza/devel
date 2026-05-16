
import { drumClip, melodyClip, writeClipsToMidi } from '/home/err/devel/packages/beat-agent/src/index.js';

const tempo = 85;
const key = 'Cm';

// Crystalline Drums: Precise, sharp, high-end
const kick = drumClip({ pattern: 'x---x---', instrument: 'C2' });
const snare = drumClip({ pattern: '--x---x-', instrument: 'D2' });
const hat = drumClip({ pattern: 'x-x-x-x-', instrument: 'F#2' });
const openHat = drumClip({ pattern: '----x---', instrument: 'G2' });

// Luxe G-Funk Bass: Thick, sliding, prestigious
const bass = melodyClip({ 
    root: 'C2', 
    scaleName: 'minor', 
    pattern: 'x-x-x---' 
});

// Shimmering Suture Melody: Descending, crystalline
const lead = melodyClip({ 
    root: 'G4', 
    scaleName: 'minor', 
    pattern: 'x---x-x-' 
});

writeClipsToMidi([kick, snare, hat, openHat, bass, lead], '/home/err/devel/Sutured_Sovereignty.mid');
console.log('Sutured_Sovereignty.mid generated.');
