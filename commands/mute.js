const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { addCase } = require('../utils/cases');
const { sendLog, modLogEmbed } = require('../utils/logger');
const { parseDuration, formatDuration } = require('../utils/duration');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mettre un membre en sourdine (timeout)')
    .addUserOption((o) => o.setName('user').setDescription('Membre à mute').setRequired(true))
    .addStringOption((o) => o.setName('duration').setDescription('Durée (ex: 10m, 1h, 1d)').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Raison'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const durationStr = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'Aucune raison fournie';
    const ms = parseDuration(durationStr);
    if (!ms) return interaction.reply({ content: 'Durée invalide. Exemples : 30s, 10m, 1h, 2d.', ephemeral: true });
    if (ms > 28 * 86400000) return interaction.reply({ content: 'La durée maximale est de 28 jours.', ephemeral: true });

    if (target.id === interaction.user.id) return interaction.reply({ content: 'Vous ne pouvez pas vous mute vous-même.', ephemeral: true });
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member) return interaction.reply({ content: 'Ce membre n\'est pas sur le serveur.', ephemeral: true });
    if (!member.moderatable) return interaction.reply({ content: 'Je ne peux pas mute ce membre (rôle supérieur au mien).', ephemeral: true });
    if (interaction.guild.ownerId !== interaction.user.id && interaction.member.roles.highest.position <= member.roles.highest.position) {
      return interaction.reply({ content: 'Vous ne pouvez pas mute un membre avec un rôle supérieur ou égal au vôtre.', ephemeral: true });
    }

    await interaction.deferReply();
    try {
      await target.send(`Vous avez été mis en **sourdine** sur **${interaction.guild.name}** pour **${formatDuration(ms)}**.\nRaison : ${reason}\nModérateur : ${interaction.user.tag}`);
    } catch {}
    try {
      await member.timeout(ms, reason);
    } catch (err) {
      return interaction.editReply(`Échec du mute : ${err.message}`);
    }
    const c = addCase({ type: 'MUTE', guildId: interaction.guild.id, userId: target.id, userTag: target.tag, moderatorId: interaction.user.id, moderatorTag: interaction.user.tag, reason: `${reason} (${formatDuration(ms)})` });
    const embed = new EmbedBuilder().setTitle('🔇 Mute (timeout)').setColor(0xfee75c)
      .addFields(
        { name: 'Utilisateur', value: `${target.tag} (${target.id})`, inline: true },
        { name: 'Modérateur', value: interaction.user.tag, inline: true },
        { name: 'Durée', value: formatDuration(ms), inline: true },
        { name: 'Raison', value: reason },
        { name: 'Case', value: `#${c.id}`, inline: true },
      ).setTimestamp();
    await interaction.editReply({ embeds: [embed] });
    await sendLog(interaction.client, modLogEmbed({
      title: '🔇 Mute',
      color: 0xfee75c,
      fields: [
        { name: 'Utilisateur', value: `${target.tag} (${target.id})`, inline: true },
        { name: 'Modérateur', value: interaction.user.tag, inline: true },
        { name: 'Durée', value: formatDuration(ms), inline: true },
        { name: 'Raison', value: reason },
        { name: 'Case', value: `#${c.id}`, inline: true },
      ],
    }));
  },
};
