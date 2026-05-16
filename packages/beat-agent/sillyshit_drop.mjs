import { drumClip, melodyClip, writeClipsToMidi } from '/home/err/devel/packages/beat-agent/src/index.js';
import { wavToOgg } from '/home/err/devel/packages/beat-agent/src/render.js';
import { playInVoice } from '/home/err/devel/packages/beat-agent/src/discord.js';
import { Client, GatewayIntentBits } from 'discord.js';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

async function run() {
    const midiPath = '/tmp/sillyshit.mid';
    const wavPath = '/tmp/sillyshit.wav';
    const oggPath = '/tmp/sillyshit.ogg';
    const sf2Path = '/usr/share/sounds/sf2/FluidR3_GM.sf2';

    console.log('--- Composing Sillyshit Motif ---');
    // Slop: erratic, dissonant
    const kickSlop = drumClip({ pattern: 'x--x-x--', instrument: 'C2' });
    const snareSlop = drumClip({ pattern: '--x---x-', instrument: 'E2' });
    const hatSlop = drumClip({ pattern: 'x-x-x-x-', instrument: 'D#2' });
    const melSlop = melodyClip({ root: 'C4', scaleName: 'chromatic', degrees: [0, 1, 6, 11], pattern: 'x-x-xxx-' });

    // Truth: steady, harmonic
    const kickTruth = drumClip({ pattern: 'x---x---', instrument: 'C2' });
    const snareTruth = drumClip({ pattern: '----x---', instrument: 'E2' });
    const hatTruth = drumClip({ pattern: 'x-x-x-x-', instrument: 'D#2' });
    const melTruth = melodyClip({ root: 'C4', scaleName: 'major', degrees: [0, 2, 4, 7], pattern: 'x-x-x-x-x-x-x-' });

    const clips = [kickSlop, snareSlop, hatSlop, melSlop, kickTruth, snareTruth, hatTruth, melTruth];
    writeClipsToMidi(clips, midiPath);
    console.log(`MIDI written to ${midiPath}`);

    console.log('--- Rendering MIDI to WAV ---');
    try {
        execSync(`fluidsynth -n -i ${sf2Path} ${midiPath} -F ${wavPath}`);
        console.log(`WAV rendered to ${wavPath}`);
    } catch (e) {
        console.error('FluidSynth failed:', e);
        process.exit(1);
    }

    console.log('--- Rendering WAV to Ogg ---');
    const renderedOgg = await wavToOgg(wavPath, '/tmp');
    console.log(`Ogg rendered to ${renderedOgg}`);
    
    const finalOgg = renderedOgg || oggPath;

    console.log('--- Triggering Beat Drop in Discord ---');
    const client = new Client({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
    });
    
    if (!process.env.DISCORD_TOKEN) {
        console.error('Error: DISCORD_TOKEN environment variable is missing.');
        process.exit(1);
    }

    await client.login(process.env.DISCORD_TOKEN);
    
    const guildId = '1444142672548986994';
    const channelId = '1459643341452083446'; // #vc1

    try {
        await playInVoice({ client, guildId, channelId, audioPath: finalOgg });
        console.log('Beat drop successful!');
    } catch (e) {
        console.error('Discord playback failed:', e);
    } finally {
        client.destroy();
    }
}

run().catch(console.error);
