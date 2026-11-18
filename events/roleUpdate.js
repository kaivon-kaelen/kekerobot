const { Events } = require('discord.js');
const { sendLog, modLogEmbed } = require('../utils/logger');

module.exports = {
  name: Events.GuildRoleUpdate,
  async execute(oldRole, newRole) {
    try {
      if (!oldRole || !newRole) return;
      const changes = [];
      if (oldRole.name !== newRole.name) changes.push(`**Nom** : ${oldRole.name} → ${newRole.name}`);
      if (oldRole.color !== newRole.color) changes.push(`**Couleur** modifiée`);
      if (oldRole.hoist !== newRole.hoist) changes.push(`**Hoist** : ${oldRole.hoist} → ${newRole.hoist}`);
      if (oldRole.mentionable !== newRole.mentionable) changes.push(`**Mentionnable** : ${oldRole.mentionable} → ${newRole.mentionable}`);
      const oldPerms = oldRole.permissions.bitfield.toString();
      const newPerms = newRole.permissions.bitfield.toString();
      if (oldPerms !== newPerms) changes.push(`**Permissions** modifiées`);
      if (!changes.length) return;
      const embed = modLogEmbed({
        title: '✏️ Rôle modifié',
        color: 0xfee75c,
        fields: [
          { name: 'Rôle', value: `${newRole} (${newRole.id})`, inline: true },
          { name: 'Modifications', value: changes.join('\n').slice(0, 1024) },
        ],
      });
      await sendLog(newRole.client, embed);
    } catch (err) {
      console.error('[roleUpdate]', err?.message);
    }
  },
};