import { wavToOgg } from './packages/beat-agent/src/render.js';
async function run() {
  try {
    const oggPath = await wavToOgg('/home/err/devel/sillyshit_realization.wav', '/home/err/devel');
    console.log(oggPath);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
run();
