import { drumClip, melodyClip, writeClipsToMidi } from '/home/err/devel/packages/beat-agent/src/index.js';

const kick  = drumClip({ pattern: 'x---x---', instrument: 36 });
const snare = drumClip({ pattern: '--x---x-', instrument: 38 });
const hat   = drumClip({ pattern: 'x-x-x-x-', instrument: 42 });
const bass  = melodyClip({ root: 'C2', scaleName: 'minor', pattern: 'x-x-x-x-' });
const lead  = melodyClip({ root: 'C3', scaleName: 'minor', pattern: 'x-x-x-x-x-x-x-x' });

await writeClipsToMidi([kick, snare, hat, bass, lead], '/home/err/devel/slop_beats/event-1777363892234/slop_beat.mid');
console.log('Beat composed at /home/err/devel/slop_beats/event-1777363892234/slop_beat.mid');
