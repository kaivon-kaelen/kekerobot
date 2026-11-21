const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { stop } = require('../utils/music');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Arrêter la musique et vider la file'),
  async execute(interaction) {
    stop(interaction.guild.id);
    return interaction.reply('🛑 Lecture arrêtée et file vidée.');
  },
};
