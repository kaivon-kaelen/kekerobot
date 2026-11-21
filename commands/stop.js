const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { stop } = require('../utils/music');
const { sendLog, modLogEmbed } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Arrêter la musique et vider la file'),
  async execute(interaction) {
    stop(interaction.guild.id);

    await sendLog(interaction.client, modLogEmbed({
      title: '🛑 Stop musique',
      color: 0x95a5a6,
      fields: [
        { name: 'Salon', value: `${interaction.channel}`, inline: true },
        { name: 'Utilisateur', value: interaction.user.tag, inline: true },
      ],
    }));

    return interaction.reply('🛑 Lecture arrêtée et file vidée.');
  },
};
