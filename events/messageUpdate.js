const { Events, EmbedBuilder } = require('discord.js');
const { sendLog, modLogEmbed, LOG_CHANNEL_ID } = require('../utils/logger');

module.exports = {
  name: Events.MessageUpdate,
  async execute(oldMessage, newMessage) {
    try {
      if (!oldMessage || !newMessage) return;
      if (newMessage.channel?.id === LOG_CHANNEL_ID) return;
      if (oldMessage.partial) await oldMessage.fetch().catch(() => null);
      if (newMessage.partial) await newMessage.fetch().catch(() => null);
      if (!newMessage.author || newMessage.author.bot) return;
      const wasPartial = oldMessage.partial;
      if (wasPartial) await oldMessage.fetch().catch(() => null);
      const sameContent = oldMessage.content === newMessage.content;
      const sameAttachments = (oldMessage.attachments?.size ?? 0) === (newMessage.attachments?.size ?? 0);
      const sameEmbeds = (oldMessage.embeds?.length ?? 0) === (newMessage.embeds?.length ?? 0);
      // Si le message n'était pas en cache, on ne peut pas comparer : on log quand même
      if (!wasPartial && sameContent && sameAttachments && sameEmbeds) return;

      const before = (oldMessage.content || '(pas de contenu)').slice(0, 1024);
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