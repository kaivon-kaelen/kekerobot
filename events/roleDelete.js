const { Events } = require('discord.js');
const { sendLog, modLogEmbed } = require('../utils/logger');

module.exports = {
  name: Events.GuildRoleDelete,
  async execute(role) {
    try {
      if (!role) return;
      const embed = modLogEmbed({
        title: '🗑️ Rôle supprimé',
        color: 0xed4245,
        fields: [
          { name: 'Nom', value: role.name || 'inconnu', inline: true },
          { name: 'ID', value: role.id, inline: true },
        ],
      });
      await sendLog(role.client, embed);
    } catch (err) {
      console.error('[roleDelete]', err?.message);
    }
  },
};