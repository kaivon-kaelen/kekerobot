const { Events, ChannelType } = require('discord.js');
const { sendLog, modLogEmbed } = require('../utils/logger');

module.exports = {
  name: Events.ChannelCreate,
  async execute(channel) {
    try {
      if (!channel || channel.id === (process.env.LOG_CHANNEL_ID || '1396210242022539468')) return;
      if (typeof channel.isThread === 'function' && channel.isThread()) return;
      const embed = modLogEmbed({
        title: '📁 Salon créé',
        color: 0x5865f2,
        fields: [
          { name: 'Salon', value: `${channel} (${channel.id})`, inline: true },
          { name: 'Type', value: `${ChannelType[channel.type] ?? channel.type}`, inline: true },
        ],
      });
      await sendLog(channel.client, embed);
    } catch (err) {
      console.error('[channelCreate]', err?.message);
    }
  },
};