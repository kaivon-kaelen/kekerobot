const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { listCases } = require('../utils/cases');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cases')
    .setDescription('Lister les cases de modération')
    .addUserOption((o) => o.setName('user').setDescription('Filtrer par utilisateur'))
    .addIntegerOption((o) => o.setName('limit').setDescription('Nombre (max 25)').setMinValue(1).setMaxValue(25))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const limit = interaction.options.getInteger('limit') || 10;
    const cases = listCases({ guildId: interaction.guild.id, userId: user?.id, limit });
    if (!cases.length) return interaction.reply({ content: 'Aucune case trouvée.', ephemeral: true });
    const lines = cases.map((c) => `**#${c.id}** [${c.type}] ${c.userTag} — ${c.reason}`).join('\n');
    const embed = new EmbedBuilder()
      .setTitle(user ? `Cases de ${user.tag}` : 'Dernières cases')
      .setColor(0x5865f2)
      .setDescription(lines);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
