const { Events } = require('discord.js');
const { sendLog, modLogEmbed } = require('../utils/logger');

module.exports = {
  name: Events.GuildMemberRemove,
  async execute(member) {
    try {
      if (!member) return;
      const user = member.user || (member.id ? await member.client.users.fetch(member.id).catch(() => null) : null);
      const embed = modLogEmbed({
        title: '📤 Membre parti',
        color: 0xed4245,
        fields: [
          { name: 'Utilisateur', value: `${user?.tag || 'inconnu'} (${member.id})`, inline: true },
          { name: 'Membres', value: `${member.guild?.memberCount ?? '?'}`, inline: true },
        ],
      });
      if (user?.displayAvatarURL) embed.setThumbnail(user.displayAvatarURL());
      await sendLog(member.client, embed);
    } catch (err) {
      console.error('[guildMemberRemove]', err?.message);
    }
  },
};