const { ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getOpenByUser, getOpenByThread, createTicket } = require('../utils/modmail');
const pending = require('../utils/modmail-pending');
const { addMapping } = require('../utils/modmail-messages');
const { speak, getTextChannel } = require('../utils/tts');

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

    // TTS : lire les messages du salon texte configuré
    if (message.guild && message.channel.type === ChannelType.GuildText) {
      const ttsChannel = getTextChannel(message.guild.id);
      if (ttsChannel && message.channel.id === ttsChannel) {
        const content = message.content.trim();
        if (content) {
          await speak(message.guild, content, message.channel.id).catch(() => {});
        }
      }
    }

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
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`modmail_confirm_${message.author.id}`)
          .setLabel('Confirmer et envoyer')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('📩'),
        new ButtonBuilder()
          .setCustomId(`modmail_cancel_${message.author.id}`)
          .setLabel('Annuler')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌'),
      );

      const confirmation = await message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Confirmation modmail')
            .setDescription('Cliquez sur le bouton pour confirmer l\'envoi de votre message à la modération. Une boîte de dialogue vous demandera la raison.')
            .setColor(0x5865f2),
        ],
        components: [row],
      }).catch(() => {});

      pending.set(message.author.id, {
        messageId: message.id,
        content: message.content || '',
        attachmentUrls: [...message.attachments.values()].map((a) => a.url),
        dmChannelId: message.channel.id,
        confirmationMessageId: confirmation?.id,
      });

      await message.react('⏳').catch(() => {});
      return;
    }

    // Cas 2 : message dans un thread du forum modmail -> répondre en MP
    if (message.channel.isThread() && message.channel.parentId === FORUM_ID) {
      const ticket = getOpenByThread(message.channel.id);
      if (!ticket || !ticket.open) return;
      const user = await message.client.users.fetch(ticket.userId).catch(() => null);
      if (!user) return;
      const sent = await user.send(buildContent(message)).catch(() => null);
      if (sent) {
        // stocker mapping pour réactions (message thread -> message DM)
        addMapping(sent.id, message.id, message.channel.id, ticket.userId);
      }
      await message.react('✅').catch(() => {});
      return;
    }
  },
};
