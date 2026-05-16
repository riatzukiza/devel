import { wavToOgg } from './packages/beat-agent/src/render.js';

async function main() {
    try {
        const oggPath = await wavToOgg('/tmp/potato_beat.wav', '/tmp');
        console.log(`Ogg written to ${oggPath}`);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

main();
