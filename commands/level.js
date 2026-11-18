const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const {
  getUserData,
  levelFromXP,
  xpForCurrentLevel,
  xpNeededForCurrentLevel,
  getRank,
} = require('../utils/levels');

function makeProgressBar(current, needed, length = 12) {
  if (!needed || needed <= 0) return '░'.repeat(length);
  const ratio = Math.max(0, Math.min(1, current / needed));
  const filled = Math.max(0, Math.min(length, Math.round(ratio * length)));
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('Affiche votre niveau et votre XP')
    .addUserOption((o) => o.setName('user').setDescription('Utilisateur (optionnel)')),
  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const guildId = interaction.guild.id;
    const userId = target.id;

    const data = getUserData(guildId, userId);
    if (!data) {
      return interaction.reply({ content: `${target.tag} n'a encore aucun niveau enregistré.`, flags: MessageFlags.Ephemeral });
    }

    const xp = data.xp || 0;
    const level = data.level || levelFromXP(xp);
    const currentXP = xpForCurrentLevel(xp);
    const neededXP = xpNeededForCurrentLevel(xp);
    const rank = getRank(guildId, userId);
    const bar = makeProgressBar(currentXP, neededXP);

    const embed = new EmbedBuilder()
      .setTitle(`📊 Niveau de ${target.tag}`)
      .setColor(0x5865f2)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: 'Niveau', value: `${level}`, inline: true },
        { name: 'Rang', value: rank ? `#${rank}` : 'inconnu', inline: true },
        { name: 'XP total', value: `${xp}`, inline: true },
        { name: 'Progression', value: `\`${bar}\` ${currentXP} / ${neededXP} XP`, inline: false },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};