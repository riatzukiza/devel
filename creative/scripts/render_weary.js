import { wavToOgg } from './packages/beat-agent/src/render.js';

async function run() {
  try {
    const result = await wavToOgg('./Music/weary_dev.wav', './Music');
    console.log('Ogg created at:', result);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
