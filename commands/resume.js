const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { resume } = require('../utils/music');
const { sendLog, modLogEmbed } = require('../utils/logger');

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

    await sendLog(interaction.client, modLogEmbed({
      title: '▶️ Reprise musique',
      color: 0x95a5a6,
      fields: [
        { name: 'Salon', value: `${interaction.channel}`, inline: true },
        { name: 'Utilisateur', value: interaction.user.tag, inline: true },
      ],
    }));

    return interaction.reply('▶️ Lecture reprise.');
  },
};
