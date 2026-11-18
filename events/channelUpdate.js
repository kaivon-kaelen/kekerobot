const { Events } = require('discord.js');
const { sendLog, modLogEmbed } = require('../utils/logger');

module.exports = {
  name: Events.ChannelUpdate,
  async execute(oldChannel, newChannel) {
    try {
      if (!oldChannel || !newChannel) return;
      if (newChannel.id === (process.env.LOG_CHANNEL_ID || '1396210242022539468')) return;
      const changes = [];
      if (oldChannel.name !== newChannel.name) changes.push(`**Nom** : ${oldChannel.name} → ${newChannel.name}`);
      // Permissions (overwrites)
      const oldOw = (oldChannel.permissionOverwrites?.cache?.size ?? 0);
      const newOw = (newChannel.permissionOverwrites?.cache?.size ?? 0);
      if (oldOw !== newOw) changes.push(`**Permissions** modifiées (${oldOw} → ${newOw} overwrites)`);

      // Topic (text channels)
      if (oldChannel.topic !== newChannel.topic) changes.push(`**Sujet** modifié`);

      // NSFW
      if (oldChannel.nsfw !== newChannel.nsfw) changes.push(`**NSFW** : ${oldChannel.nsfw} → ${newChannel.nsfw}`);

      // Slowmode
      if (oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) changes.push(`**Slowmode** : ${oldChannel.rateLimitPerUser}s → ${newChannel.rateLimitPerUser}s`);

      if (!changes.length) return;
      const embed = modLogEmbed({
        title: '✏️ Salon modifié',
        color: 0xfee75c,
        fields: [
          { name: 'Salon', value: `${newChannel} (${newChannel.id})`, inline: true },
          { name: 'Modifications', value: changes.join('\n').slice(0, 1024) },
        ],
      });
      await sendLog(newChannel.client, embed);
    } catch (err) {
      console.error('[channelUpdate]', err?.message);
    }
  },
};