const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ChannelType } = require('discord.js');
const { setTextChannel, removeTextChannel, getTextChannel, isConnected } = require('../utils/tts');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tts-channel')
    .setDescription('Configurer le salon texte pour le TTS')
    .addChannelOption((o) => o.setName('salon').setDescription('Salon texte à lire').addChannelTypes(ChannelType.GuildText))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    const channel = interaction.options.getChannel('salon');

    if (!channel) {
      const current = getTextChannel(interaction.guild.id);
      if (!current) {
        return interaction.reply({ content: 'Aucun salon texte configuré pour le TTS.', flags: MessageFlags.Ephemeral });
      }
      removeTextChannel(interaction.guild.id);
      return interaction.reply({ content: '✅ Salon texte TTS supprimé.', flags: MessageFlags.Ephemeral });
    }

    setTextChannel(interaction.guild.id, channel.id);
    await interaction.reply({ content: `✅ Salon texte TTS configuré : ${channel}.`, flags: MessageFlags.Ephemeral });
  },
};
