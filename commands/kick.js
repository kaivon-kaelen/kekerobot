const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { addCase } = require('../utils/cases');
const { sendLog, modLogEmbed } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulser un membre du serveur')
    .addUserOption((o) => o.setName('user').setDescription('Membre à expulser').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Raison de l\'expulsion'))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'Aucune raison fournie';

    if (target.id === interaction.user.id) return interaction.reply({ content: 'Vous ne pouvez pas vous expulser vous-même.', ephemeral: true });
    if (target.id === interaction.client.user.id) return interaction.reply({ content: 'Je ne peux pas m\'expulser.', ephemeral: true });

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member) return interaction.reply({ content: 'Ce membre n\'est pas sur le serveur.', ephemeral: true });
    if (!member.kickable) return interaction.reply({ content: 'Je ne peux pas expulser ce membre (rôle supérieur au mien).', ephemeral: true });
    if (interaction.guild.ownerId !== interaction.user.id && interaction.member.roles.highest.position <= member.roles.highest.position) {
      return interaction.reply({ content: 'Vous ne pouvez pas expulser un membre avec un rôle supérieur ou égal au vôtre.', ephemeral: true });
    }

    await interaction.deferReply();
    try {
      await target.send(`Vous avez été **expulsé** de **${interaction.guild.name}**.\nRaison : ${reason}\nModérateur : ${interaction.user.tag}`);
    } catch {}
    try {
      await member.kick(reason);
    } catch (err) {
      return interaction.editReply(`Échec de l'expulsion : ${err.message}`);
    }
    const c = addCase({ type: 'KICK', guildId: interaction.guild.id, userId: target.id, userTag: target.tag, moderatorId: interaction.user.id, moderatorTag: interaction.user.tag, reason });
    const embed = new EmbedBuilder().setTitle('👢 Expulsion').setColor(0xffa500)
      .addFields(
        { name: 'Utilisateur', value: `${target.tag} (${target.id})`, inline: true },
        { name: 'Modérateur', value: interaction.user.tag, inline: true },
        { name: 'Raison', value: reason },
        { name: 'Case', value: `#${c.id}`, inline: true },
      ).setTimestamp();
    await interaction.editReply({ embeds: [embed] });
    await sendLog(interaction.client, modLogEmbed({
      title: '👢 Kick',
      color: 0xffa500,
      fields: [
        { name: 'Utilisateur', value: `${target.tag} (${target.id})`, inline: true },
        { name: 'Modérateur', value: interaction.user.tag, inline: true },
        { name: 'Raison', value: reason },
        { name: 'Case', value: `#${c.id}`, inline: true },
      ],
    }));
  },
};
