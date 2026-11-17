const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { addCase } = require('../utils/cases');
const { sendLog, modLogEmbed } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Retirer la sourdine d\'un membre')
    .addUserOption((o) => o.setName('user').setDescription('Membre').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Raison'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'Aucune raison fournie';
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member) return interaction.reply({ content: 'Ce membre n\'est pas sur le serveur.', ephemeral: true });
    await interaction.deferReply();
    try {
      await member.timeout(null, reason);
    } catch (err) {
      return interaction.editReply(`Échec : ${err.message}`);
    }
    const c = addCase({ type: 'UNMUTE', guildId: interaction.guild.id, userId: target.id, userTag: target.tag, moderatorId: interaction.user.id, moderatorTag: interaction.user.tag, reason });
    const embed = new EmbedBuilder().setTitle('🔊 Unmute').setColor(0x57f287)
      .addFields(
        { name: 'Utilisateur', value: `${target.tag} (${target.id})`, inline: true },
        { name: 'Modérateur', value: interaction.user.tag, inline: true },
        { name: 'Raison', value: reason },
        { name: 'Case', value: `#${c.id}`, inline: true },
      ).setTimestamp();
    await interaction.editReply({ embeds: [embed] });
    await sendLog(interaction.client, modLogEmbed({
      title: '🔊 Unmute',
      color: 0x57f287,
      fields: [
        { name: 'Utilisateur', value: `${target.tag} (${target.id})`, inline: true },
        { name: 'Modérateur', value: interaction.user.tag, inline: true },
        { name: 'Raison', value: reason },
        { name: 'Case', value: `#${c.id}`, inline: true },
      ],
    }));
  },
};
