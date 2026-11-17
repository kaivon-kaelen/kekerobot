const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { closeTicket } = require('../utils/modmail');
const { sendLog, modLogEmbed } = require('../utils/logger');

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
    await sendLog(interaction.client, modLogEmbed({
      title: '🔒 Modmail fermé',
      color: 0x95a5a6,
      fields: [
        { name: 'Thread', value: `${channel.name} (${channel.id})`, inline: true },
        { name: 'Modérateur', value: interaction.user.tag, inline: true },
        { name: 'Utilisateur', value: `${ticket.userTag} (${ticket.userId})`, inline: true },
      ],
    }));
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
