const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLeaderboard, levelFromXP } = require('../utils/levels');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Affiche le classement des niveaux du serveur'),
  async execute(interaction) {
    const guildId = interaction.guild.id;
    const leaderboard = getLeaderboard(guildId, 10);

    if (!leaderboard.length) {
      return interaction.reply({ content: 'Aucun niveau enregistré pour ce serveur.', ephemeral: true });
    }

    const lines = leaderboard.map((entry, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**${i + 1}.**`;
      return `${medal} ${entry.userTag} — Niveau ${entry.level} (${entry.xp} XP)`;
    }).join('\n');

    const embed = new EmbedBuilder()
      .setTitle(`🏆 Leaderboard — ${interaction.guild.name}`)
      .setDescription(lines)
      .setColor(0x5865f2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};