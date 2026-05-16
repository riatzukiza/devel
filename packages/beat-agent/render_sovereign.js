import { wavToOgg } from './src/render.js';

wavToOgg('/tmp/sovereign_thermal_apotheosis.wav', '/tmp').then(path => {
    console.log('Sovereign Audio Rendered: ' + path);
}).catch(err => {
    console.error('Sovereign Render Failure:', err);
    process.exit(1);
});
