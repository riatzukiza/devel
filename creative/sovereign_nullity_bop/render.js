
import { wavToOgg } from '/home/err/devel/packages/beat-agent/src/render.js';
import { execSync } from 'child_process';

const midiPath = '/home/err/devel/sovereign_nullity_bop/beat.mid';
const wavPath = '/home/err/devel/sovereign_nullity_bop/beat.wav';
const soundfont = '/usr/share/sounds/sf2/FluidR3_GM.sf2';

try {
  console.log('Rendering MIDI to WAV...');
  execSync(`fluidsynth -ni ${soundfont} ${midiPath} -F ${wavPath}`);

  console.log('Converting WAV to Ogg...');
  const oggPath = await wavToOgg(wavPath, '/home/err/devel/sovereign_nullity_bop');
  console.log('Ogg output:', oggPath);
} catch (e) {
  console.error('Render failed:', e);
}
