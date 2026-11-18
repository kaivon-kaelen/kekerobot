const { Events } = require('discord.js');
const { sendLog, modLogEmbed } = require('../utils/logger');

module.exports = {
  name: Events.ChannelDelete,
  async execute(channel) {
    try {
      if (!channel || channel.id === (process.env.LOG_CHANNEL_ID || '1396210242022539468')) return;
      if (typeof channel.isThread === 'function' && channel.isThread()) return;
      const embed = modLogEmbed({
        title: '🗑️ Salon supprimé',
        color: 0xed4245,
        fields: [
          { name: 'Nom', value: channel.name || 'inconnu', inline: true },
          { name: 'ID', value: channel.id, inline: true },
        ],
      });
      await sendLog(channel.client, embed);
    } catch (err) {
      console.error('[channelDelete]', err?.message);
    }
  },
};