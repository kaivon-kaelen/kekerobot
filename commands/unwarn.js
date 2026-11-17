const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { listCases, removeWarn, getLastWarn, addCase, countWarns } = require('../utils/cases');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unwarn')
    .setDescription('Retirer un avertissement')
    .addStringOption((o) => o.setName('user').setDescription('ID ou nom d\'utilisateur').setRequired(true))
    .addIntegerOption((o) => o.setName('case_id').setDescription('Numéro de la case à retirer (optionnel)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const input = interaction.options.getString('user').trim();
    const caseId = interaction.options.getInteger('case_id');
    await interaction.deferReply();

    let cases = listCases({ guildId: interaction.guild.id, limit: 100 });
    if (/^\\d+$/.test(input)) {
      cases = cases.filter((c) => c.userId === input);
    } else {
      const q = input.toLowerCase();
      cases = cases.filter((c) => (c.userTag || '').toLowerCase().includes(q));
    }
    if (!cases.length) return interaction.editReply(`Aucun utilisateur correspondant à "${input}".`);

    // Si plusieurs utilisateurs, on prend le premier (ou on pourrait demander). On prend le premier.
    const userId = cases[0].userId;
    const userTag = cases[0].userTag;

    let targetCase = null;
    if (caseId) {
      const c = cases.find((x) => x.id === caseId && x.type === 'WARN' && !x.removed);
      if (!c) return interaction.editReply(`Case #${caseId} introuvable ou déjà retirée.`);
      targetCase = c;
    } else {
      targetCase = getLastWarn(interaction.guild.id, userId);
      if (!targetCase) return interaction.editReply(`${userTag} n'a aucun avertissement actif.`);
    }

    const removed = removeWarn(targetCase.id, interaction.user.tag, interaction.user.id);
    if (!removed) return interaction.editReply('Impossible de retirer cet avertissement.');

    addCase({
      type: 'UNWARN',
      guildId: interaction.guild.id,
      userId,
      userTag,
      moderatorId: interaction.user.id,
      moderatorTag: interaction.user.tag,
      reason: `Retrait de l'avertissement #${targetCase.id}`,
    });

    const remaining = countWarns(interaction.guild.id, userId);
    try {
      const u = await interaction.client.users.fetch(userId);
      await u.send(`Un avertissement a été retiré sur **${interaction.guild.name}** (case #${targetCase.id}).\nAvertissements restants : ${remaining}`);
    } catch {}

    const embed = new EmbedBuilder().setTitle('✅ Avertissement retiré').setColor(0x57f287)
      .addFields(
        { name: 'Utilisateur', value: `${userTag} (${userId})`, inline: true },
        { name: 'Modérateur', value: interaction.user.tag, inline: true },
        { name: 'Case retirée', value: `#${targetCase.id}`, inline: true },
        { name: 'Avertissements restants', value: `${remaining}`, inline: true },
      ).setTimestamp();
    await interaction.editReply({ embeds: [embed] });
  },
};
