const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { skip } = require('../utils/music');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Passer au morceau suivant'),
  async execute(interaction) {
    if (!skip(interaction.guild.id)) {
      return interaction.reply({
        content: 'Aucune musique en cours de lecture.',
        flags: MessageFlags.Ephemeral,
      });
    }
    return interaction.reply('⏭️ Morceau suivant...');
  },
};
