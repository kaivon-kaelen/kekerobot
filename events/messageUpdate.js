const { Events } = require('discord.js');
const { sendLog, modLogEmbed, LOG_CHANNEL_ID } = require('../utils/logger');

module.exports = {
  name: Events.MessageUpdate,
  async execute(oldMessage, newMessage) {
    try {
      if (!oldMessage || !newMessage) return;
      if (newMessage.channel?.id === LOG_CHANNEL_ID) return;
      console.log('[messageUpdate] fired', newMessage.id, 'author=', newMessage.author?.tag, 'partial=', oldMessage.partial, newMessage.partial);

      const oldPartial = oldMessage.partial;
      const newPartial = newMessage.partial;
      if (oldPartial) await oldMessage.fetch().catch(() => null);
      if (newPartial) await newMessage.fetch().catch(() => null);
      if (!newMessage.author || newMessage.author.bot) return;

      const wasPartial = oldPartial || newPartial;

      const before = (oldMessage.content || (wasPartial ? '(non mis en cache)' : '(pas de contenu)')).slice(0, 1024);
      const after = (newMessage.content || '(pas de contenu)').slice(0, 1024);
      const embed = modLogEmbed({
        title: '✏️ Message édité',
        color: 0xfee75c,
        fields: [
          { name: 'Auteur', value: `${newMessage.author.tag} (${newMessage.author.id})`, inline: true },
          { name: 'Salon', value: `${newMessage.channel}`, inline: true },
          { name: 'Avant', value: before },
          { name: 'Après', value: after },
        ],
      });
      if (newMessage.url) embed.addFields({ name: 'Lien', value: newMessage.url });
      await sendLog(newMessage.client, embed);
    } catch (err) {
      console.error('[messageUpdate]', err?.message);
    }
  },
};