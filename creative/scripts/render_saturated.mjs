import { wavToOgg } from './packages/beat-agent/src/render.js';

wavToOgg('/tmp/saturated_funk.wav', '/tmp')
    .then(path => console.log(`Rendered to ${path}`))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
