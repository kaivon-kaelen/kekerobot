const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Supprimer des messages dans le salon')
    .addIntegerOption((o) => o.setName('amount').setDescription('Nombre de messages (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption((o) => o.setName('user').setDescription('Filtrer par utilisateur'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const amount = interaction.options.getInteger('amount');
    const filterUser = interaction.options.getUser('user');
    const messages = await interaction.channel.messages.fetch({ limit: amount });
    let toDelete = messages;
    if (filterUser) toDelete = messages.filter((m) => m.author.id === filterUser.id);
    const deleted = await interaction.channel.bulkDelete(toDelete, true).catch(() => null);
    const count = deleted ? deleted.size : 0;
    await interaction.editReply(`🗑️ ${count} message(s) supprimé(s).`);
  },
};
