const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { closeTicket } = require('../utils/modmail');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('close')
    .setDescription('Fermer un ticket modmail (à utiliser dans le thread)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const channel = interaction.channel;
    if (!channel.isThread()) return interaction.reply({ content: 'Cette commande doit être utilisée dans un thread de modmail.', ephemeral: true });

    const ticket = closeTicket(channel.id);
    if (!ticket) return interaction.reply({ content: 'Aucun ticket ouvert pour ce thread.', ephemeral: true });

    await interaction.reply('Ticket fermé. Archivage du thread...');
    try {
      const user = await interaction.client.users.fetch(ticket.userId);
      await user.send('Votre ticket de modmail a été fermé par la modération. Merci de nous avoir contactés.').catch(() => {});
    } catch {}
    try {
      await channel.setLocked(true);
      await channel.setArchived(true);
    } catch {}
  },
};
