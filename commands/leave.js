const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { leave, isConnected } = require('../utils/tts');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Fait quitter le salon vocal au bot (TTS)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Connect),
  async execute(interaction) {
    if (!isConnected(interaction.guild.id)) {
      return interaction.reply({ content: 'Le bot n\'est pas connecté à un salon vocal.', flags: MessageFlags.Ephemeral });
    }

    await leave(interaction.guild.id);
    await interaction.reply({ content: '👋 Déconnecté du salon vocal.', flags: MessageFlags.Ephemeral });
  },
};
