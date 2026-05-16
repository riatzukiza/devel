import {
  joinVoiceChannel, createAudioPlayer, createAudioResource,
  AudioPlayerStatus, VoiceConnectionStatus, entersState,
} from '@discordjs/voice';
import fs from 'fs';

export async function playInVoice({ client, guildId, channelId, audioPath }) {
  const channel = await client.channels.fetch(channelId);
  const connection = joinVoiceChannel({
    channelId, guildId,
    adapterCreator: channel.guild.voiceAdapterCreator,
  });
  await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
  const player = createAudioPlayer();
  const resource = createAudioResource(fs.createReadStream(audioPath));
  connection.subscribe(player);
  player.play(resource);
  return new Promise((resolve, reject) => {
    player.on(AudioPlayerStatus.Idle, () => { connection.destroy(); resolve(); });
    player.on('error', reject);
  });
}
