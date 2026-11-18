const { Events } = require('discord.js');
const { sendLog, modLogEmbed, LOG_CHANNEL_ID } = require('../utils/logger');

module.exports = {
  name: Events.MessageBulkDelete,
  async execute(messages, channel) {
    try {
      if (!channel || channel.id === LOG_CHANNEL_ID) return;
      const count = messages?.size ?? 0;
      const authors = new Set();
      for (const m of (messages?.values() || [])) {
        if (m?.author && !m.author.bot) authors.add(m.author.tag);
      }
      const embed = modLogEmbed({
        title: '🗑️ Suppression en masse',
        color: 0xed4245,
        fields: [
          { name: 'Salon', value: `${channel}`, inline: true },
          { name: 'Nombre', value: `${count}`, inline: true },
          { name: 'Auteurs', value: authors.size ? [...authors].slice(0, 20).join(', ') : 'inconnus' },
        ],
      });
      await sendLog(channel.client, embed);
    } catch (err) {
      console.error('[messageDeleteBulk]', err?.message);
    }
  },
};