import { drumClip, melodyClip, writeClipsToMidi } from './packages/beat-agent/src/index.js';
import { wavToOgg } from './packages/beat-agent/src/render.js';
import { execSync } from 'child_process';
import path from 'path';

async function main() {
  const midiPath = '/tmp/slop_beat.mid';
  const wavPath = '/tmp/slop_beat.wav';
  const sf2Path = '/usr/share/sounds/sf2/FluidR3_GM.sf2';

  console.log('Composing chaotic slop...');
  const kick = drumClip({ pattern: 'x---x-x-x--x-x-', instrument: 'C2' });
  const snare = drumClip({ pattern: '--x--x--x--x-x-', instrument: 'D2' });
  const hat = drumClip({ pattern: 'x-x-x-x-x-x-x-x', instrument: 'G2' });
  
  const mel1 = melodyClip({ root: 'C3', scaleName: 'major', degrees: [0, 1, 2, 0], pattern: 'x-x-x-x-x-x-x-x' });
  const mel2 = melodyClip({ root: 'B2', scaleName: 'major', degrees: [0, 1, 2, 0], pattern: 'x--x---x---x-x-' });

  writeClipsToMidi([kick, snare, hat, mel1, mel2], midiPath);

  console.log('Rendering MIDI to WAV...');
  execSync(`fluidsynth -n ${sf2Path} ${midiPath} -F ${wavPath}`);

  console.log('Converting WAV to Ogg...');
  const oggPath = await wavToOgg(wavPath);
  console.log(`Final file: ${oggPath}`);
}

main().catch(console.error);
