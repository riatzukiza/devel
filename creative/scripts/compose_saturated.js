const { drumClip, melodyClip, chordClip, writeClipsToMidi } = require('./packages/beat-agent/src/index.js');

const tempo = 92;
const key = 'Eb';
const scale = 'minor';

const kick = drumClip({ pattern: 'x---x-x--', instrument: 36 });
const snare = drumClip({ pattern: '----x---x', instrument: 38 });
const hat = drumClip({ pattern: 'x-x-x-x-x-', instrument: 42 });

// G-Funk Bassline (Simplified: Eb -> Bb)
const bass = melodyClip({ 
    root: 'Eb1', 
    scaleName: 'minor', 
    pattern: 'x--x-x---' 
});

// G-Funk Whistle (High sine)
const whistle = melodyClip({ 
    root: 'Eb5', 
    scaleName: 'minor', 
    pattern: '---x-x---' 
});

writeClipsToMidi([kick, snare, hat, bass, whistle], '/tmp/saturated_funk.mid')
    .then(() => console.log('MIDI written to /tmp/saturated_funk.mid'))
    .catch(err => console.error(err));
