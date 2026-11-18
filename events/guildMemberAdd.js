const { Events } = require('discord.js');
const { sendLog, modLogEmbed } = require('../utils/logger');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    try {
      if (!member) return;
      const created = member.user?.createdAt ? `<t:${Math.floor(member.user.createdAt.getTime() / 1000)}:R>` : 'inconnu';
      const embed = modLogEmbed({
        title: '📥 Membre rejoint',
        color: 0x57f287,
        fields: [
          { name: 'Utilisateur', value: `${member.user.tag} (${member.id})`, inline: true },
          { name: 'Compte créé', value: created, inline: true },
          { name: 'Membres', value: `${member.guild.memberCount}`, inline: true },
        ],
      });
      if (member.user.displayAvatarURL) embed.setThumbnail(member.user.displayAvatarURL());
      await sendLog(member.client, embed);
    } catch (err) {
      console.error('[guildMemberAdd]', err?.message);
    }
  },
};