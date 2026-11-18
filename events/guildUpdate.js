const { Events } = require('discord.js');
const { sendLog, modLogEmbed } = require('../utils/logger');

module.exports = {
  name: Events.GuildUpdate,
  async execute(oldGuild, newGuild) {
    try {
      if (!oldGuild || !newGuild) return;
      const changes = [];
      if (oldGuild.name !== newGuild.name) changes.push(`**Nom** : ${oldGuild.name} → ${newGuild.name}`);
      if (oldGuild.icon !== newGuild.icon) changes.push(`**Icône** modifiée`);
      if (oldGuild.banner !== newGuild.banner) changes.push(`**Bannière** modifiée`);
      if (oldGuild.description !== newGuild.description) changes.push(`**Description** modifiée`);
      if (oldGuild.verificationLevel !== newGuild.verificationLevel) changes.push(`**Vérification** : ${oldGuild.verificationLevel} → ${newGuild.verificationLevel}`);
      if (oldGuild.defaultMessageNotifications !== newGuild.defaultMessageNotifications) changes.push(`**Notifications** modifiées`);
      if (!changes.length) return;
      const embed = modLogEmbed({
        title: '✏️ Serveur modifié',
        color: 0xfee75c,
        fields: [
          { name: 'Serveur', value: `${newGuild.name} (${newGuild.id})`, inline: true },
          { name: 'Modifications', value: changes.join('\n').slice(0, 1024) },
        ],
      });
      await sendLog(newGuild.client, embed);
    } catch (err) {
      console.error('[guildUpdate]', err?.message);
    }
  },
};