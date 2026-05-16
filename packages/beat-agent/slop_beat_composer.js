import { drumClip, melodyClip } from './src/compose.js';
import { writeClipsToMidi } from './src/midi.js';

const clips = [
  drumClip({ pattern: 'x-x-x--x-x--x-x-x-x-x--x-x-x-x-' }),
  melodyClip({ 
    root: 'C4', 
    scaleName: 'major', 
    degrees: [0, 1, 2, 3, 4, 5, 6, 7], 
    pattern: 'x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-' 
  })
];

const midiPath = '/tmp/slop_beat.mid';
try {
  writeClipsToMidi(clips, midiPath);
  console.log(`Slop-beat successfully rendered to ${midiPath}`);
} catch (err) {
  console.error(`Error rendering slop-beat: ${err}`);
  process.exit(1);
}
