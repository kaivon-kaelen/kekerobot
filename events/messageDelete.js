const { Events } = require('discord.js');
const { sendLog, modLogEmbed, LOG_CHANNEL_ID } = require('../utils/logger');

module.exports = {
  name: Events.MessageDelete,
  async execute(message) {
    try {
      if (!message) return;
      if (message.channel?.id === LOG_CHANNEL_ID) return;
      if (message.partial) await message.fetch().catch(() => null);
      if (!message.author || message.author.bot) return;

      const content = (message.content || '(pas de contenu)').slice(0, 1024);
      const embed = modLogEmbed({
        title: '🗑️ Message supprimé',
        color: 0xed4245,
        fields: [
          { name: 'Auteur', value: `${message.author.tag} (${message.author.id})`, inline: true },
          { name: 'Salon', value: `${message.channel}`, inline: true },
          { name: 'Contenu', value: content },
        ],
      });
      if (message.url) embed.addFields({ name: 'Lien', value: message.url });
      await sendLog(message.client, embed);
    } catch (err) {
      console.error('[messageDelete]', err?.message);
    }
  },
};