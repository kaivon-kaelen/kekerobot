const { Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const { getOpenByUser, createTicket } = require('../utils/modmail');
const { sendLog, modLogEmbed } = require('../utils/logger');
const pending = require('../utils/modmail-pending');
const { addMapping } = require('../utils/modmail-messages');

const FORUM_ID = process.env.MODMAIL_FORUM_CHANNEL_ID;

// Supprime le message de confirmation (boutons) une fois le choix fait
async function deleteConfirmationMessage(interaction, pendingData) {
  try {
    if (interaction.message?.deletable) {
      await interaction.message.delete();
      return;
    }
    if (pendingData?.confirmationMessageId) {
      const channel = await interaction.client.channels.fetch(pendingData.dmChannelId);
      const message = await channel.messages.fetch(pendingData.confirmationMessageId);
      await message.delete();
    }
  } catch {
    // Message déjà supprimé ou introuvable : rien à faire
  }
}

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // Bouton d'annulation modmail
    if (interaction.isButton() && interaction.customId.startsWith('modmail_cancel_')) {
      const userId = interaction.customId.replace('modmail_cancel_', '');
      if (interaction.user.id !== userId) {
        return interaction.reply({ content: 'Ce bouton ne vous est pas destiné.', ephemeral: true });
      }
      const p = pending.get(userId);
      pending.delete(userId);
      // Retirer la réaction ⏳ sur le message original
      if (p) {
        try {
          const dmChannel = await interaction.client.channels.fetch(p.dmChannelId);
          const originalMsg = await dmChannel.messages.fetch(p.messageId);
          const reaction = originalMsg.reactions.cache.get('⏳');
          if (reaction) await reaction.users.remove(interaction.client.user.id).catch(() => {});
        } catch {}
      }
      await interaction.reply({ content: '❌ Envoi annulé.', ephemeral: true });
      await deleteConfirmationMessage(interaction, p);
      return;
    }

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
      await deleteConfirmationMessage(interaction, p);
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

      // Créer le thread avec la raison dans le titre (max 100 caractères)
      const shortReason = reason.replace(/\s+/g, ' ').trim();
      const threadName = `Modmail — ${interaction.user.tag} — ${shortReason}`.slice(0, 100);
      const thread = await forum.threads.create({
        name: threadName,
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
      await sendLog(interaction.client, modLogEmbed({
        title: '📩 Nouveau modmail',
        color: 0x5865f2,
        fields: [
          { name: 'Utilisateur', value: `${interaction.user.tag} (${userId})`, inline: true },
          { name: 'Thread', value: `${thread.name} (${thread.id})`, inline: true },
          { name: 'Raison', value: reason.slice(0, 1024) },
        ],
      }));

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

      await deleteConfirmationMessage(interaction, p);
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

    // Log des commandes de modération utilisées
    const MOD_COMMANDS = new Set(['ban','unban','kick','mute','unmute','warn','unwarn','purge','say','reply','replay','close','modpanel','cases','case','casedetail','warnings']);
    if (MOD_COMMANDS.has(interaction.commandName)) {
      const { sendLog, modLogEmbed } = require('../utils/logger');
      await sendLog(interaction.client, modLogEmbed({
        title: '⚙️ Commande de modération utilisée',
        color: 0x95a5a6,
        fields: [
          { name: 'Commande', value: `/${interaction.commandName}`, inline: true },
          { name: 'Utilisateur', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
          { name: 'Salon', value: `${interaction.channel}`, inline: true },
        ],
      }));
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
