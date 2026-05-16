import { drumClip, melodyClip, writeClipsToMidi } from '/home/err/devel/packages/beat-agent/src/index.js';

const kick  = drumClip({ pattern: 'x---x-x--', instrument: 'C2' });
const snare = drumClip({ pattern: '----x---x', instrument: 'D2' });
const hat   = drumClip({ pattern: 'x-x-x-x-x', instrument: 'F#2' });
const mel   = melodyClip({ root: 'C3', scaleName: 'minor', degrees: [0, 3, 7], pattern: 'x---x-x-x' });

writeClipsToMidi([kick, snare, hat, mel], '/home/err/devel/slop_beats/event-1777363892234/slop_beat.mid');
console.log('MIDI generated at /home/err/devel/slop_beats/event-1777363892234/slop_beat.mid');
