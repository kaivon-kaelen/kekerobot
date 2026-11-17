const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('replay')
    .setDescription('Répondre à un message avec le bot (admin)')
    .addStringOption((o) => o.setName('message_id').setDescription('ID du message').setRequired(true))
    .addStringOption((o) => o.setName('message').setDescription('Réponse').setRequired(true))
    .addChannelOption((o) => o.setName('salon').setDescription('Salon (optionnel)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const messageId = interaction.options.getString('message_id');
    const text = interaction.options.getString('message');
    const channel = interaction.options.getChannel('salon') || interaction.channel;
    const target = await channel.messages.fetch(messageId).catch(() => null);
    if (!target) return interaction.reply({ content: 'Message introuvable.', ephemeral: true });
    await channel.send({ content: text, reply: { messageReference: target.id } });
    await interaction.reply({ content: 'Réponse envoyée.', ephemeral: true });
  },
};
