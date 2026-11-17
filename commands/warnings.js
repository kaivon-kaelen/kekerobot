const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { listCases } = require('../utils/cases');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Lister les avertissements d\'un membre')
    .addUserOption((o) => o.setName('user').setDescription('Membre').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const warns = listCases({ guildId: interaction.guild.id, userId: target.id, limit: 20 }).filter((c) => c.type === 'WARN' && !c.removed);
    if (!warns.length) return interaction.reply({ content: `${target.tag} n'a aucun avertissement.`, ephemeral: true });
    const lines = warns.map((c) => `**#${c.id}** — ${new Date(c.timestamp).toLocaleString('fr-FR')} — ${c.reason}`).join('\n');
    const embed = new EmbedBuilder().setTitle(`⚠️ Avertissements de ${target.tag}`).setColor(0xfee75c).setDescription(lines);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
