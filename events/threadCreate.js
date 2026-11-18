const { Events } = require('discord.js');
const { sendLog, modLogEmbed } = require('../utils/logger');

module.exports = {
  name: Events.ThreadCreate,
  async execute(thread, newlyCreated) {
    try {
      if (!thread) return;
      if (thread.id === (process.env.LOG_CHANNEL_ID || '1396210242022539468')) return;
      const embed = modLogEmbed({
        title: '🧵 Thread créé',
        color: 0x5865f2,
        fields: [
          { name: 'Thread', value: `${thread} (${thread.id})`, inline: true },
          { name: 'Parent', value: thread.parent ? `${thread.parent}` : 'inconnu', inline: true },
          { name: 'Créateur', value: thread.ownerId ? `<@${thread.ownerId}>` : 'inconnu', inline: true },
        ],
      });
      await sendLog(thread.client, embed);
    } catch (err) {
      console.error('[threadCreate]', err?.message);
    }
  },
};