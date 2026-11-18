const { Events } = require('discord.js');
const { sendLog, modLogEmbed } = require('../utils/logger');

module.exports = {
  name: Events.GuildBanAdd,
  async execute(ban) {
    try {
      if (!ban) return;
      const embed = modLogEmbed({
        title: '🔨 Bannissement (détecté)',
        color: 0xed4245,
        fields: [
          { name: 'Utilisateur', value: `${ban.user.tag} (${ban.user.id})`, inline: true },
          { name: 'Raison', value: ban.reason || 'Aucune raison fournie' },
        ],
      });
      if (ban.user.displayAvatarURL) embed.setThumbnail(ban.user.displayAvatarURL());
      await sendLog(ban.client ?? ban.guild?.client, embed);
    } catch (err) {
      console.error('[guildBanAdd]', err?.message);
    }
  },
};