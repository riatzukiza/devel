const { drumClip, melodyClip, writeClipsToMidi } = require('./packages/beat-agent/src/index.js');

const kick  = drumClip({ pattern: 'x---x---', instrument: 36 });
const snare = drumClip({ pattern: '--x---x-', instrument: 38 });
const hat   = drumClip({ pattern: 'x-x-x-x-', instrument: 42 });
const mel   = melodyClip({ root: 'C3', scaleName: 'minor', pattern: 'x-x-xxx-' });

writeClipsToMidi([kick, snare, hat, mel], 'Saturated_Beat.mid')
  .then(() => console.log('MIDI generated: Saturated_Beat.mid'))
  .catch(err => console.error('Error:', err));
