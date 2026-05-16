import { wavToOgg } from './packages/beat-agent/src/index.js';

async function main() {
  try {
    const oggPath = await wavToOgg('/home/err/devel/sillyshit_realization.wav', '/home/err/devel');
    console.log(`Ogg written to ${oggPath}`);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
