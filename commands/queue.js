const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getQueueList } = require('../utils/music');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Afficher la file d\'attente musicale'),
  async execute(interaction) {
    const { current, items } = getQueueList(interaction.guild.id);

    if (!current && !items.length) {
      return interaction.reply('La file d\'attente est vide.');
    }

    const lines = [];
    if (current) lines.push(`**En cours :** ${current.title} — ${current.requestedBy}`);
    items.slice(0, 10).forEach((item, i) => {
      lines.push(`**${i + 1}.** ${item.title} — ${item.requestedBy}`);
    });
    if (items.length > 10) lines.push(`… et ${items.length - 10} autre(s)`);

    const embed = new EmbedBuilder()
      .setTitle('🎶 File d\'attente')
      .setDescription(lines.join('\n').slice(0, 4096))
      .setColor(0x5865f2)
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
