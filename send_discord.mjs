import fs from 'fs';

async function sendDiscord(channelId, content, files = []) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    console.error('DISCORD_BOT_TOKEN not set');
    process.exit(1);
  }

  const url = `https://discord.com/api/v10/channels/${channelId}/messages`;
  
  const formData = new FormData();
  formData.append('payload_json', JSON.stringify({ content }));

  let fileIdx = 0;
  for (const filePath of files) {
    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      const blob = new Blob([fileBuffer]);
      formData.append(`files[${fileIdx}]`, blob, filePath);
      fileIdx++;
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bot ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Error sending to ${channelId}: ${response.status} ${error}`);
  } else {
    console.log(`Successfully sent to ${channelId}`);
  }
}

const args = process.argv.slice(2);
const channelId = args[0];
const content = args[1];
const files = args.slice(2);

if (!channelId || !content) {
  console.log('Usage: node send_discord.mjs <channel_id> <content> [files...]');
  process.exit(1);
}

sendDiscord(channelId, content, files).catch(console.error);
