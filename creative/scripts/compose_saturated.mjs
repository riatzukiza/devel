import { drumClip, melodyClip, writeClipsToMidi } from './packages/beat-agent/src/index.js';

const tempo = 92;
const key = 'Eb';
const scale = 'minor';

const kick = drumClip({ pattern: 'x---x-x--', instrument: 'C1' });
const snare = drumClip({ pattern: '----x---x', instrument: 'D1' });
const hat = drumClip({ pattern: 'x-x-x-x-x-', instrument: 'F#1' });

const bass = melodyClip({ 
    root: 'Eb1', 
    scaleName: 'minor', 
    pattern: 'x--x-x---' 
});

const whistle = melodyClip({ 
    root: 'Eb5', 
    scaleName: 'minor', 
    pattern: '---x-x---' 
});

writeClipsToMidi([kick, snare, hat, bass, whistle], '/tmp/saturated_funk.mid');
console.log('MIDI written to /tmp/saturated_funk.mid');
