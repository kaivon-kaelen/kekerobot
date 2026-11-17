const { Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const { getOpenByUser, createTicket } = require('../utils/modmail');
const pending = require('../utils/modmail-pending');
const { addMapping } = require('../utils/modmail-messages');

const FORUM_ID = process.env.MODMAIL_FORUM_CHANNEL_ID;

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // Bouton de confirmation modmail
    if (interaction.isButton() && interaction.customId.startsWith('modmail_confirm_')) {
      const userId = interaction.customId.replace('modmail_confirm_', '');
      if (interaction.user.id !== userId) {
        return interaction.reply({ content: 'Ce bouton ne vous est pas destiné.', ephemeral: true });
      }
      const p = pending.get(userId);
      if (!p) {
        return interaction.reply({ content: 'Demande expirée. Renvoyez votre message.', ephemeral: true });
      }

      const modal = new ModalBuilder()
        .setCustomId(`modmail_modal_${userId}`)
        .setTitle('Modmail — Raison');

      const reasonInput = new TextInputBuilder()
        .setCustomId('reason')
        .setLabel('Raison / sujet de votre message')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(4000);
      if (p.content) reasonInput.setValue(p.content.slice(0, 4000));

      modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
      await interaction.showModal(modal);
      return;
    }

    // Soumission du modal modmail
    if (interaction.isModalSubmit() && interaction.customId.startsWith('modmail_modal_')) {
      const userId = interaction.customId.replace('modmail_modal_', '');
      if (interaction.user.id !== userId) return;
      const p = pending.get(userId);
      if (!p) {
        return interaction.reply({ content: 'Demande expirée.', ephemeral: true });
      }

      const reason = interaction.fields.getTextInputValue('reason');
      await interaction.deferReply({ ephemeral: true });

      const forum = await interaction.client.channels.fetch(FORUM_ID).catch(() => null);
      if (!forum) return interaction.editReply('Forum introuvable.');

      // Créer le thread
      const thread = await forum.threads.create({
        name: `Modmail — ${interaction.user.tag}`.slice(0, 100),
        message: {
          embeds: [
            new EmbedBuilder()
              .setTitle('📩 Nouveau modmail')
              .setDescription(reason)
              .addFields(
                { name: 'Utilisateur', value: `${interaction.user.tag} (${interaction.user.id})` },
                { name: 'Message original', value: (p.content || '(pas de contenu)').slice(0, 1024) },
              )
              .setColor(0x5865f2)
              .setTimestamp(),
          ],
        },
      }).catch(() => null);

      if (!thread) return interaction.editReply('Impossible de créer le ticket.');

      createTicket(userId, interaction.user.tag, thread.id);

      // Récupérer le message initial du thread pour le mapping réactions
      let starterMsg = null;
      try { starterMsg = await thread.fetchStarterMessage(); } catch {}
      if (starterMsg) addMapping(p.messageId, starterMsg.id, thread.id, userId);

      // Réagir au message original en MP
      try {
        const dmChannel = await interaction.client.channels.fetch(p.dmChannelId);
        const originalMsg = await dmChannel.messages.fetch(p.messageId);
        await originalMsg.react('✅');
      } catch {}

      // Joindre les pièces jointes si présentes
      if (p.attachmentUrls.length) {
        const attMsg = await thread.send(p.attachmentUrls.join('\n')).catch(() => null);
        if (attMsg) addMapping(p.messageId, attMsg.id, thread.id, userId);
      }

      pending.delete(userId);

      await interaction.editReply('✅ Votre message a été envoyé à la modération.');
      // DM de confirmation
      try {
        await interaction.user.send('Votre ticket modmail a été créé. La modération vous répondra ici.');
      } catch {}
      return;
    }

    // Bouton refresh modpanel
    if (interaction.isButton()) {
      if (interaction.customId === 'mod_refresh') {
        await interaction.deferUpdate().catch(() => {});
      }
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
      console.error(`Commande inconnue: ${interaction.commandName}`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      const reply = { content: 'Une erreur est survenue lors de l\'exécution de cette commande.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  },
};
