const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { pause } = require('../utils/music');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Mettre la musique en pause'),
  async execute(interaction) {
    if (!pause(interaction.guild.id)) {
      return interaction.reply({
        content: 'Aucune musique en cours de lecture.',
        flags: MessageFlags.Ephemeral,
      });
    }
    return interaction.reply('⏸️ Lecture en pause.');
  },
};
