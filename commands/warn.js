const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { addCase, countWarns } = require('../utils/cases');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Avertir un membre')
    .addUserOption((o) => o.setName('user').setDescription('Membre à avertir').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Raison de l\'avertissement').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');

    if (target.id === interaction.user.id) return interaction.reply({ content: 'Vous ne pouvez pas vous avertir vous-même.', ephemeral: true });
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member) return interaction.reply({ content: 'Ce membre n\'est pas sur le serveur.', ephemeral: true });

    const c = addCase({ type: 'WARN', guildId: interaction.guild.id, userId: target.id, userTag: target.tag, moderatorId: interaction.user.id, moderatorTag: interaction.user.tag, reason });
    const total = countWarns(interaction.guild.id, target.id);

    // DM best-effort
    try {
      await target.send(`Vous avez reçu un avertissement sur **${interaction.guild.name}**.\nRaison : ${reason}\nTotal d'avertissements : ${total}`);
    } catch {}

    const embed = new EmbedBuilder().setTitle('⚠️ Avertissement').setColor(0xfee75c)
      .addFields(
        { name: 'Utilisateur', value: `${target.tag} (${target.id})`, inline: true },
        { name: 'Modérateur', value: interaction.user.tag, inline: true },
        { name: 'Raison', value: reason },
        { name: 'Avertissements totaux', value: `${total}`, inline: true },
        { name: 'Case', value: `#${c.id}`, inline: true },
      ).setTimestamp();
    await interaction.reply({ embeds: [embed] });
  },
};
