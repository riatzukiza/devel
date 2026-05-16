import { drumClip, melodyClip, writeClipsToMidi } from './packages/beat-agent/src/index.js';

const kick = drumClip({ pattern: 'x---x-x-', instrument: 'C2' });
const snare = drumClip({ pattern: '---x-x--', instrument: 'D2' });
const hat = drumClip({ pattern: 'x-x-x-x-', instrument: 'F#2' });
const chaoticMelody = melodyClip({ 
    root: 'C3', 
    scaleName: 'locrian', 
    pattern: 'x-xx-x-x',
    degrees: [0, 1, 2, 4, 5] // Mix of steps to make it more jarring
});

writeClipsToMidi([kick, snare, hat, chaoticMelody], '/tmp/potato_beat.mid');
console.log('MIDI written to /tmp/potato_beat.mid');
