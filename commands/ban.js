const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { addCase } = require('../utils/cases');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bannir un membre du serveur')
    .addUserOption((o) => o.setName('user').setDescription('Membre à bannir').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Raison du bannissement'))
    .addIntegerOption((o) => o.setName('delete_days').setDescription('Jours de messages à supprimer (0-7)').setMinValue(0).setMaxValue(7))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'Aucune raison fournie';
    const deleteDays = interaction.options.getInteger('delete_days') || 0;

    if (target.id === interaction.user.id) return interaction.reply({ content: 'Vous ne pouvez pas vous bannir vous-même.', ephemeral: true });
    if (target.id === interaction.client.user.id) return interaction.reply({ content: 'Je ne peux pas me bannir.', ephemeral: true });

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (member) {
      if (!member.bannable) return interaction.reply({ content: 'Je ne peux pas bannir ce membre (rôle supérieur au mien).', ephemeral: true });
      if (interaction.guild.ownerId !== interaction.user.id && interaction.member.roles.highest.position <= member.roles.highest.position) {
        return interaction.reply({ content: 'Vous ne pouvez pas bannir un membre avec un rôle supérieur ou égal au vôtre.', ephemeral: true });
      }
    }

    await interaction.deferReply();
    // DM avant le bannissement
    try {
      await target.send(`Vous avez été **banni** de **${interaction.guild.name}**.\nRaison : ${reason}\nModérateur : ${interaction.user.tag}`);
    } catch {}
    try {
      await interaction.guild.members.ban(target, { reason, deleteMessageSeconds: deleteDays * 86400 });
    } catch (err) {
      return interaction.editReply(`Échec du bannissement : ${err.message}`);
    }

    const c = addCase({ type: 'BAN', guildId: interaction.guild.id, userId: target.id, userTag: target.tag, moderatorId: interaction.user.id, moderatorTag: interaction.user.tag, reason });
    const embed = new EmbedBuilder()
      .setTitle('🔨 Bannissement')
      .setColor(0xed4245)
      .addFields(
        { name: 'Utilisateur', value: `${target.tag} (${target.id})`, inline: true },
        { name: 'Modérateur', value: interaction.user.tag, inline: true },
        { name: 'Raison', value: reason },
        { name: 'Case', value: `#${c.id}`, inline: true },
      )
      .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
  },
};
