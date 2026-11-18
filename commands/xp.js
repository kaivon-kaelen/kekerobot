const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { addXP, getUserData, levelFromXP, xpForLevel } = require('../utils/levels');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('xp')
    .setDescription('Gérer l\'XP d\'un utilisateur (admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Ajouter de l\'XP à un utilisateur')
        .addUserOption((o) => o.setName('user').setDescription('Utilisateur').setRequired(true))
        .addIntegerOption((o) => o.setName('montant').setDescription('Montant d\'XP à ajouter').setRequired(true).setMinValue(1))
    )
    .addSubcommand((sub) =>
      sub
        .setName('remove')
        .setDescription('Retirer de l\'XP à un utilisateur')
        .addUserOption((o) => o.setName('user').setDescription('Utilisateur').setRequired(true))
        .addIntegerOption((o) => o.setName('montant').setDescription('Montant d\'XP à retirer').setRequired(true).setMinValue(1))
    )
    .addSubcommand((sub) =>
      sub
        .setName('set')
        .setDescription('Définir le niveau d\'un utilisateur')
        .addUserOption((o) => o.setName('user').setDescription('Utilisateur').setRequired(true))
        .addIntegerOption((o) => o.setName('niveau').setDescription('Niveau cible').setRequired(true).setMinValue(0))
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getUser('user');
    const guildId = interaction.guild.id;
    const userId = target.id;

    if (sub === 'add') {
      const amount = interaction.options.getInteger('montant');
      const data = addXP(guildId, userId, target.tag, amount);
      if (!data) return interaction.reply({ content: 'Erreur lors de l\'ajout d\'XP.', ephemeral: true });

      const embed = new EmbedBuilder()
        .setTitle('➕ XP ajoutée')
        .setColor(0x57f287)
        .addFields(
          { name: 'Utilisateur', value: `${target.tag} (${target.id})`, inline: true },
          { name: 'XP ajoutée', value: `${amount}`, inline: true },
          { name: 'Niveau', value: `${data.newLevel}`, inline: true },
        )
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'remove') {
      const amount = interaction.options.getInteger('montant');
      const current = getUserData(guildId, userId);
      if (!current) return interaction.reply({ content: `${target.tag} n'a aucun XP enregistré.`, ephemeral: true });

      const newXP = Math.max(0, (current.xp || 0) - amount);
      const newLevel = levelFromXP(newXP);
      const data = addXP(guildId, userId, target.tag, newXP - (current.xp || 0));
      if (!data) return interaction.reply({ content: 'Erreur lors du retrait d\'XP.', ephemeral: true });

      const embed = new EmbedBuilder()
        .setTitle('➖ XP retirée')
        .setColor(0xed4245)
        .addFields(
          { name: 'Utilisateur', value: `${target.tag} (${target.id})`, inline: true },
          { name: 'XP retirée', value: `${amount}`, inline: true },
          { name: 'Niveau', value: `${newLevel}`, inline: true },
        )
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'set') {
      const level = interaction.options.getInteger('niveau');
      const targetXP = xpForLevel(level);
      const current = getUserData(guildId, userId);
      const currentXP = current ? current.xp : 0;
      const diff = targetXP - currentXP;
      const data = addXP(guildId, userId, target.tag, diff);
      if (!data) return interaction.reply({ content: 'Erreur lors de la définition du niveau.', ephemeral: true });

      const embed = new EmbedBuilder()
        .setTitle('🎯 Niveau défini')
        .setColor(0x5865f2)
        .addFields(
          { name: 'Utilisateur', value: `${target.tag} (${target.id})`, inline: true },
          { name: 'Niveau', value: `${level}`, inline: true },
          { name: 'XP totale', value: `${data.xp}`, inline: true },
        )
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    return interaction.reply({ content: 'Sous-commande inconnue.', ephemeral: true });
  },
};