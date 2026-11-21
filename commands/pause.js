const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { pause } = require('../utils/music');
const { sendLog, modLogEmbed } = require('../utils/logger');

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

    await sendLog(interaction.client, modLogEmbed({
      title: '⏸️ Pause musique',
      color: 0x95a5a6,
      fields: [
        { name: 'Salon', value: `${interaction.channel}`, inline: true },
        { name: 'Utilisateur', value: interaction.user.tag, inline: true },
      ],
    }));

    return interaction.reply('⏸️ Lecture en pause.');
  },
};
