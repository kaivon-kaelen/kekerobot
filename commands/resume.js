const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { resume } = require('../utils/music');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Reprendre la musique'),
  async execute(interaction) {
    if (!resume(interaction.guild.id)) {
      return interaction.reply({
        content: 'Aucune musique en pause.',
        flags: MessageFlags.Ephemeral,
      });
    }
    return interaction.reply('▶️ Lecture reprise.');
  },
};
