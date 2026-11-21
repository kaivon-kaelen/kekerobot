const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { connect, isConnected, setTextChannel } = require('../utils/tts');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('join')
    .setDescription('Fait rejoindre le salon vocal au bot pour le TTS')
    .addChannelOption((o) => o.setName('salon').setDescription('Salon vocal').setRequired(true))
    .addChannelOption((o) => o.setName('texte').setDescription('Salon texte à lire (optionnel)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Connect),
  async execute(interaction) {
    const voiceChannel = interaction.options.getChannel('salon');
    const textChannel = interaction.options.getChannel('texte');

    if (!voiceChannel.isVoiceBased()) {
      return interaction.reply({ content: 'Ce salon n\'est pas un salon vocal.', flags: MessageFlags.Ephemeral });
    }

    if (isConnected(interaction.guild.id)) {
      return interaction.reply({ content: 'Le bot est déjà connecté à un salon vocal.', flags: MessageFlags.Ephemeral });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      await connect(interaction.guild, voiceChannel.id, textChannel ? textChannel.id : null);
      if (textChannel) setTextChannel(interaction.guild.id, textChannel.id);
      await interaction.editReply({ content: `🔊 Connecté à ${voiceChannel}.` + (textChannel ? ` Salon texte : ${textChannel}.` : '') });
    } catch (err) {
      console.error('[join] Erreur connexion :', err?.message);
      await interaction.editReply({ content: '❌ Impossible de se connecter au salon vocal.' });
    }
  },
};
