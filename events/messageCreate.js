const { ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getOpenByUser, getOpenByThread, createTicket } = require('../utils/modmail');
const pending = require('../utils/modmail-pending');
const { addMapping } = require('../utils/modmail-messages');

const FORUM_ID = process.env.MODMAIL_FORUM_CHANNEL_ID;

function buildContent(message) {
  let text = message.content || '';
  if (message.attachments.size) {
    const links = [...message.attachments.values()].map((a) => a.url).join('\n');
    text += (text ? '\n' : '') + links;
  }
  return text || '(pas de contenu)';
}

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot) return;

    // Cas 1 : message en MP
    if (message.channel.type === ChannelType.DM) {
      if (!FORUM_ID) return;
      const forum = await message.client.channels.fetch(FORUM_ID).catch(() => null);
      if (!forum) return;

      let ticket = getOpenByUser(message.author.id);
      if (ticket) {
        // Ticket ouvert : transférer le message
        const thread = await message.client.channels.fetch(ticket.threadId).catch(() => null);
        if (thread) {
          const sent = await thread.send({
            embeds: [
              new EmbedBuilder()
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setDescription(buildContent(message))
                .setColor(0x5865f2)
                .setTimestamp(),
            ],
          }).catch(() => null);
          if (sent) addMapping(message.id, sent.id, thread.id, message.author.id);
        }
        await message.react('✅').catch(() => {});
        return;
      }

      // Pas de ticket : demander confirmation via bouton
      pending.set(message.author.id, {
        messageId: message.id,
        content: message.content || '',
        attachmentUrls: [...message.attachments.values()].map((a) => a.url),
        dmChannelId: message.channel.id,
      });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`modmail_confirm_${message.author.id}`)
          .setLabel('Confirmer et envoyer')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('📩'),
      );

      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Confirmation modmail')
            .setDescription('Cliquez sur le bouton pour confirmer l\'envoi de votre message à la modération. Une boîte de dialogue vous demandera la raison.')
            .setColor(0x5865f2),
        ],
        components: [row],
      }).catch(() => {});
      await message.react('⏳').catch(() => {});
      return;
    }

    // Cas 2 : message dans un thread du forum modmail -> répondre en MP
    if (message.channel.isThread() && message.channel.parentId === FORUM_ID) {
      const ticket = getOpenByThread(message.channel.id);
      if (!ticket || !ticket.open) return;
      const user = await message.client.users.fetch(ticket.userId).catch(() => null);
      if (!user) return;
      const sent = await user.send({
        embeds: [
          new EmbedBuilder()
            .setAuthor({ name: `Modération — ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setDescription(buildContent(message))
            .setColor(0xfee75c)
            .setTimestamp(),
        ],
      }).catch(() => null);
      if (sent) {
        // stocker mapping pour réactions (message thread -> message DM)
        addMapping(sent.id, message.id, message.channel.id, ticket.userId);
      }
      await message.react('✅').catch(() => {});
      return;
    }
  },
};
