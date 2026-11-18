const { Events, EmbedBuilder } = require('discord.js');
const { sendLog, modLogEmbed } = require('../utils/logger');
const { generateWelcomeImage } = require('../utils/generateWelcome');

const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID;

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    try {
      if (!member) return;

      // Log de modération (salons de logs)
      const created = member.user?.createdAt ? `<t:${Math.floor(member.user.createdAt.getTime() / 1000)}:R>` : 'inconnu';
      const logEmbed = modLogEmbed({
        title: '📥 Membre rejoint',
        color: 0x57f287,
        fields: [
          { name: 'Utilisateur', value: `${member.user.tag} (${member.id})`, inline: true },
          { name: 'Compte créé', value: created, inline: true },
          { name: 'Membres', value: `${member.guild.memberCount}`, inline: true },
        ],
      });
      if (member.user.displayAvatarURL) logEmbed.setThumbnail(member.user.displayAvatarURL());
      await sendLog(member.client, logEmbed);

      // Message de bienvenue avec image générée
      const channelId = WELCOME_CHANNEL_ID;
      if (!channelId) return;

      const channel = member.guild.channels.cache.get(channelId);
      if (!channel || !channel.isTextBased()) return;

      const attachment = await generateWelcomeImage(member.user, member.guild);

      const welcomeEmbed = new EmbedBuilder()
        .setTitle('👋 Bienvenue !')
        .setDescription(`Salut ${member.user}, bienvenue sur **${member.guild.name}** !\n\nNous sommes maintenant **${member.guild.memberCount}** membres.`)
        .setColor(0x5865f2)
        .setImage('attachment://welcome.png')
        .setTimestamp();

      await channel.send({ embeds: [welcomeEmbed], files: [attachment] });
    } catch (err) {
      console.error('[guildMemberAdd]', err?.message);
    }
  },
};