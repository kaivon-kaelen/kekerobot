const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { closeTicket } = require('../utils/modmail');
const { sendLog, modLogEmbed } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('close')
    .setDescription('Fermer un ticket modmail (à utiliser dans le thread)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    // Acquitter immédiatement : Discord n'attend que 3 secondes avant de considérer
    // l'interaction comme échouée, et le token devient ensuite invalide (10062).
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    } catch (err) {
      console.error('[close] Impossible d\'acquitter l\'interaction :', err?.message);
      return;
    }

    const channel = interaction.channel;
    if (!channel.isThread()) {
      return interaction.editReply('Cette commande doit être utilisée dans un thread de modmail.').catch(() => {});
    }

    const ticket = closeTicket(channel.id);
    if (!ticket) {
      return interaction.editReply('Aucun ticket ouvert pour ce thread.').catch(() => {});
    }

    await interaction.editReply('Ticket fermé. Archivage du thread...').catch(() => {});

    try {
      await sendLog(interaction.client, modLogEmbed({
        title: '🔒 Modmail fermé',
        color: 0x95a5a6,
        fields: [
          { name: 'Thread', value: `${channel.name} (${channel.id})`, inline: true },
          { name: 'Modérateur', value: interaction.user.tag, inline: true },
          { name: 'Utilisateur', value: `${ticket.userTag} (${ticket.userId})`, inline: true },
        ],
      }));

      const user = await interaction.client.users.fetch(ticket.userId).catch(() => null);
      if (user) {
        await user.send('Votre ticket de modmail a été fermé par la modération. Merci de nous avoir contactés.').catch(() => {});
      }

      await channel.setLocked(true).catch(() => {});
      await channel.setArchived(true).catch(() => {});
    } catch (err) {
      console.error('[close] Erreur pendant la clôture :', err?.message);
    }
  },
};
