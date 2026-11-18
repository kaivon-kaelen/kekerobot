const { Events } = require('discord.js');
const { sendLog, modLogEmbed, LOG_CHANNEL_ID } = require('../utils/logger');

module.exports = {
  name: Events.MessageDelete,
  async execute(message) {
    try {
      if (!message) return;
      if (message.channel?.id === LOG_CHANNEL_ID) return;
      const wasPartial = message.partial;
      if (wasPartial) await message.fetch().catch(() => null);
      if (message.author && message.author.bot) return;

      const content = (message.content || (wasPartial ? '(message non mis en cache — contenu indisponible)' : '(pas de contenu)')).slice(0, 1024);
      const author = message.author ? `${message.author.tag} (${message.author.id})` : `inconnu (${message.id})`;
      const embed = modLogEmbed({
        title: '🗑️ Message supprimé',
        color: 0xed4245,
        fields: [
          { name: 'Auteur', value: author, inline: true },
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