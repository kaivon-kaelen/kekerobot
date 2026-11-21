const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ChannelType } = require('discord.js');
const { connect, isConnected } = require('../utils/tts');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('join')
    .setDescription('Rejoint le salon vocal où vous êtes pour le TTS')
    .setDefaultMemberPermissions(PermissionFlagsBits.Connect),
  async execute(interaction) {
    const voiceChannel = interaction.member?.voice?.channel;

    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
      return interaction.reply({
        content: 'Vous devez être dans un salon vocal pour utiliser cette commande.',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (isConnected(interaction.guild.id)) {
      return interaction.reply({
        content: 'Le bot est déjà connecté à un salon vocal.',
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      await connect(interaction.guild, voiceChannel.id);
      await interaction.editReply(`🔊 Connecté à ${voiceChannel}.`);
    } catch (err) {
      console.error('[join] Erreur connexion :', err?.message);
      await interaction.editReply('❌ Impossible de se connecter au salon vocal.');
    }
  },
};
