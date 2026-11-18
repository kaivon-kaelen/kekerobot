const { Events } = require('discord.js');
const { sendLog, modLogEmbed } = require('../utils/logger');

module.exports = {
  name: Events.GuildBanRemove,
  async execute(ban) {
    try {
      if (!ban) return;
      const embed = modLogEmbed({
        title: '✅ Débannissement (détecté)',
        color: 0x57f287,
        fields: [
          { name: 'Utilisateur', value: `${ban.user.tag} (${ban.user.id})`, inline: true },
        ],
      });
      await sendLog(ban.client ?? ban.guild?.client, embed);
    } catch (err) {
      console.error('[guildBanRemove]', err?.message);
    }
  },
};