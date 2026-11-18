const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { addCase } = require('../utils/cases');
const { sendLog, modLogEmbed } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Débannir un utilisateur')
    .addStringOption((o) => o.setName('user').setDescription('ID ou nom d\'utilisateur').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Raison'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction) {
    const input = interaction.options.getString('user');
    const reason = interaction.options.getString('reason') || 'Aucune raison fournie';
    await interaction.deferReply();

    let userId = null;
    let user = null;

    if (/^\d+$/.test(input.trim())) {
      userId = input.trim();
      try { user = await interaction.client.users.fetch(userId); } catch { user = null; }
    } else {
      // Recherche par nom d'utilisateur parmi les bannis
      try {
        const bans = await interaction.guild.bans.fetch();
        const found = bans.find((b) => {
          const u = b.user;
          return u.username.toLowerCase() === input.toLowerCase()
            || u.tag.toLowerCase() === input.toLowerCase()
            || u.username.toLowerCase().includes(input.toLowerCase());
        });
        if (found) { userId = found.user.id; user = found.user; }
      } catch {}
    }

    if (!userId) return interaction.editReply('Utilisateur introuvable. Utilisez l\'ID ou un nom exact.');
    if (!user) { try { user = await interaction.client.users.fetch(userId); } catch {} }

    try {
      await interaction.guild.members.unban(userId, reason);
    } catch (err) {
      return interaction.editReply(`Échec du débannissement : ${err.message}`);
    }
    const c = addCase({ type: 'UNBAN', guildId: interaction.guild.id, userId, userTag: user.tag, moderatorId: interaction.user.id, moderatorTag: interaction.user.tag, reason });
    const embed = new EmbedBuilder().setTitle('✅ Débannissement').setColor(0x57f287)
      .addFields(
        { name: 'Utilisateur', value: `${user.tag} (${userId})`, inline: true },
        { name: 'Modérateur', value: interaction.user.tag, inline: true },
        { name: 'Raison', value: reason },
        { name: 'Case', value: `#${c.id}`, inline: true },
      ).setTimestamp();
    await interaction.editReply({ embeds: [embed] });
    await sendLog(interaction.client, modLogEmbed({
      title: '✅ Unban',
      color: 0x57f287,
      fields: [
        { name: 'Utilisateur', value: `${user.tag} (${userId})`, inline: true },
        { name: 'Modérateur', value: interaction.user.tag, inline: true },
        { name: 'Raison', value: reason },
        { name: 'Case', value: `#${c.id}`, inline: true },
      ],
    }));
  },
};
