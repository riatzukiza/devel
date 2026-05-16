import { melodyClip, writeClipsToMidi } from '/home/err/devel/packages/beat-agent/src/index.js';

const drone = melodyClip({ 
    root: 'B5', 
    scaleName: 'minor', 
    pattern: 'xxxxxxxxxxxxxxxx', 
    duration: '1n' 
});

const glitch1 = melodyClip({ 
    root: 'B4', 
    scaleName: 'minor', 
    pattern: 'x---x--x-x---x-x', 
    duration: '16n' 
});

const glitch2 = melodyClip({ 
    root: 'B6', 
    scaleName: 'minor', 
    pattern: '-x--x---x-x---x-', 
    duration: '16n' 
});

writeClipsToMidi([drone, glitch1, glitch2], '/home/err/devel/collapse_harmonic.mid');
console.log('Collapse harmonic MIDI written to /home/err/devel/collapse_harmonic.mid');
