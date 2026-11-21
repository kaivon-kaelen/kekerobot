const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const CATEGORIES = {
  '🛡️ Modération': ['ban', 'unban', 'kick', 'mute', 'unmute', 'warn', 'unwarn', 'purge', 'case', 'cases', 'casedetail'],
  '🎵 Musique': ['play', 'skip', 'pause', 'resume', 'stop', 'queue'],
  '📋 Règlement': ['reglement'],
  '🛠️ Utilitaire': ['ping', 'say', 'reply', 'replay', 'modpanel', 'level', 'xp', 'leaderboard'],
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Affiche la liste des commandes disponibles.'),
  async execute(interaction) {
    const available = new Set(interaction.client.commands.keys());
    const embed = new EmbedBuilder()
      .setTitle('📋 Commandes disponibles')
      .setColor(0x5865f2)
      .setTimestamp();

    for (const [category, names] of Object.entries(CATEGORIES)) {
      const cmds = names
        .filter((n) => available.has(n))
        .map((n) => {
          const c = interaction.client.commands.get(n);
          return `\`/${n}\` — ${c.data.description}`;
        })
        .join('\n');
      if (cmds) {
        embed.addFields({ name: category, value: cmds, inline: false });
      }
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
