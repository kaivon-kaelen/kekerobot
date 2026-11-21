const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { speak, isConnected } = require('../utils/tts');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tts-speak')
    .setDescription('Faire parler le bot immédiatement (TTS)')
    .addStringOption((o) => o.setName('message').setDescription('Texte à lire').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    if (!isConnected(interaction.guild.id)) {
      return interaction.reply({ content: 'Le bot n\'est pas connecté à un salon vocal. Utilisez /join.', flags: MessageFlags.Ephemeral });
    }

    const text = interaction.options.getString('message');
    await speak(interaction.guild, text, interaction.channelId);
    await interaction.reply({ content: '🔊 Message ajouté à la file TTS.', flags: MessageFlags.Ephemeral });
  },
};
