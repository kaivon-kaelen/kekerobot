const { Events } = require('discord.js');
const { sendLog, modLogEmbed } = require('../utils/logger');

module.exports = {
  name: Events.ThreadDelete,
  async execute(thread) {
    try {
      if (!thread) return;
      const embed = modLogEmbed({
        title: '🗑️ Thread supprimé',
        color: 0xed4245,
        fields: [
          { name: 'Nom', value: thread.name || 'inconnu', inline: true },
          { name: 'ID', value: thread.id, inline: true },
          { name: 'Parent', value: thread.parentId || 'inconnu', inline: true },
        ],
      });
      await sendLog(thread.client, embed);
    } catch (err) {
      console.error('[threadDelete]', err?.message);
    }
  },
};