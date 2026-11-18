const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { listCases } = require('../utils/cases');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('case')
    .setDescription('Afficher le casier judiciaire d\'un utilisateur')
    .addStringOption((o) => o.setName('user').setDescription('ID ou nom d\'utilisateur').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const input = interaction.options.getString('user').trim();
    let cases = listCases({ guildId: interaction.guild.id, limit: 100 });

    if (/^\d+$/.test(input)) {
      cases = cases.filter((c) => c.userId === input);
    } else {
      const q = input.toLowerCase();
      cases = cases.filter((c) => (c.userTag || '').toLowerCase().includes(q));
    }

    if (!cases.length) {
      return interaction.reply({ content: `Aucun antécédent trouvé pour "${input}" (casier vierge).`, ephemeral: true });
    }

    // Grouper par utilisateur si plusieurs
    const byUser = {};
    for (const c of cases) {
      if (!byUser[c.userId]) byUser[c.userId] = { tag: c.userTag, cases: [] };
      byUser[c.userId].cases.push(c);
    }
    const userIds = Object.keys(byUser);

    if (userIds.length === 1) {
      const u = byUser[userIds[0]];
      const counts = {};
      for (const c of u.cases) counts[c.type] = (counts[c.type] || 0) + 1;
      const summary = Object.entries(counts).map(([t, n]) => `${t}: ${n}`).join(' • ');
      const lines = u.cases.map((c) => {
        const date = new Date(c.timestamp).toLocaleString('fr-FR');
        return `**#${c.id}** [${c.type}] ${date}\n└ ${c.reason} — *par ${c.moderatorTag}*`;
      }).join('\n\n');
      const embed = new EmbedBuilder()
        .setTitle(`📁 Casier judiciaire — ${u.tag}`)
        .setColor(0x5865f2)
        .setDescription(`Total : ${u.cases.length} sanction(s)\n${summary}`)
        .addFields({ name: 'Historique', value: lines.slice(0, 4000) || '—' })
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Plusieurs utilisateurs correspondants
    const lines = cases.slice(0, 25).map((c) => `**#${c.id}** [${c.type}] ${c.userTag} — ${c.reason}`).join('\n');
    const embed = new EmbedBuilder()
      .setTitle(`📁 Résultats pour "${input}"`)
      .setColor(0x5865f2)
      .setDescription(`${cases.length} sanction(s) trouvée(s) pour ${userIds.length} utilisateur(s).`)
      .addFields({ name: 'Historique', value: lines.slice(0, 4000) || '—' });
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
