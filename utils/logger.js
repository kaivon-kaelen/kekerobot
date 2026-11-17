const { EmbedBuilder } = require('discord.js');

const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

async function sendLog(client, embed) {
  if (!LOG_CHANNEL_ID) return;
  try {
    const channel = await client.channels.fetch(LOG_CHANNEL_ID);
    if (channel) await channel.send({ embeds: [embed] });
  } catch {}
}

function modLogEmbed({ title, color, fields, thumbnail }) {
  const embed = new EmbedBuilder().setTitle(title).setColor(color).setTimestamp();
  if (fields) embed.addFields(fields);
  if (thumbnail) embed.setThumbnail(thumbnail);
  return embed;
}

module.exports = { sendLog, modLogEmbed };
