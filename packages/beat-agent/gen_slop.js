import { drumClip, melodyClip } from './src/compose.js';
import { writeClipsToMidi } from './src/midi.js';

const kick = drumClip({ pattern: 'x---x-x-', instrument: 'C2' });
const snare = drumClip({ pattern: '--x---x-', instrument: 'D2' });
const hat = drumClip({ pattern: 'x-x-x-x-', instrument: 'F#2' });
const mel = melodyClip({ 
  root: 'C4', 
  scaleName: 'minor', 
  pattern: 'x-x-x-x-x-x-x-x' 
});

try {
  writeClipsToMidi([kick, snare, hat, mel], '/tmp/slop_beat.mid');
  console.log('/tmp/slop_beat.mid');
} catch (e) {
  console.error(e);
  process.exit(1);
}
