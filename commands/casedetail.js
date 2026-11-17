const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getCase } = require('../utils/cases');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('casedetail')
    .setDescription('Afficher le détail d\'une case de modération')
    .addIntegerOption((o) => o.setName('id').setDescription('Numéro de la case').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const id = interaction.options.getInteger('id');
    const c = getCase(id);
    if (!c || c.guildId !== interaction.guild.id) return interaction.reply({ content: 'Case introuvable.', ephemeral: true });
    const embed = new EmbedBuilder().setTitle(`Case #${c.id} — ${c.type}`).setColor(0x5865f2)
      .addFields(
        { name: 'Utilisateur', value: `${c.userTag} (${c.userId})`, inline: true },
        { name: 'Modérateur', value: `${c.moderatorTag} (${c.moderatorId})`, inline: true },
        { name: 'Date', value: new Date(c.timestamp).toLocaleString('fr-FR'), inline: true },
        { name: 'Raison', value: c.reason },
      ).setTimestamp(new Date(c.timestamp));
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
