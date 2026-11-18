const { EmbedBuilder } = require('discord.js');

// Salon de logs par défaut (peut être surchargé via LOG_CHANNEL_ID dans .env)
const DEFAULT_LOG_CHANNEL_ID = '1396210242022539468';
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID || DEFAULT_LOG_CHANNEL_ID;

async function sendLog(client, embed) {
  if (!LOG_CHANNEL_ID) return;
  try {
    const channel = await client.channels.fetch(LOG_CHANNEL_ID);
    if (channel) await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error('[logger] Impossible d\'envoyer le log :', err?.message);
  }
}

function modLogEmbed({ title, color, fields, thumbnail }) {
  const embed = new EmbedBuilder().setTitle(title).setColor(color).setTimestamp();
  if (fields) embed.addFields(fields);
  if (thumbnail) embed.setThumbnail(thumbnail);
  return embed;
}

module.exports = { sendLog, modLogEmbed, LOG_CHANNEL_ID };