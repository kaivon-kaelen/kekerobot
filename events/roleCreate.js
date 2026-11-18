const { Events } = require('discord.js');
const { sendLog, modLogEmbed } = require('../utils/logger');

module.exports = {
  name: Events.GuildRoleCreate,
  async execute(role) {
    try {
      if (!role) return;
      const embed = modLogEmbed({
        title: '🛡️ Rôle créé',
        color: 0x5865f2,
        fields: [
          { name: 'Rôle', value: `${role} (${role.id})`, inline: true },
        ],
      });
      await sendLog(role.client, embed);
    } catch (err) {
      console.error('[roleCreate]', err?.message);
    }
  },
};