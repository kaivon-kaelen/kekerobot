const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('modpanel')
    .setDescription('Afficher le panneau de modération')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🛡️ Panneau de modération')
      .setColor(0x5865f2)
      .setDescription('Commandes disponibles pour la modération du serveur.')
      .addFields(
        { name: '🔨 /ban', value: 'Bannir un membre', inline: true },
        { name: '✅ /unban', value: 'Débannir un utilisateur', inline: true },
        { name: '👢 /kick', value: 'Expulser un membre', inline: true },
        { name: '🔇 /mute', value: 'Mettre en timeout', inline: true },
        { name: '🔊 /unmute', value: 'Retirer le timeout', inline: true },
        { name: '⚠️ /warn', value: 'Avertir un membre', inline: true },
        { name: '✅ /unwarn', value: 'Retirer un avertissement', inline: true },
        { name: '📋 /warnings', value: 'Voir les avertissements', inline: true },
        { name: '📁 /case', value: 'Casier judiciaire d\'un user', inline: true },
        { name: '🔍 /casedetail', value: 'Détail d\'une case', inline: true },
        { name: '🗂️ /cases', value: 'Lister les cases', inline: true },
        { name: '🗑️ /purge', value: 'Supprimer des messages', inline: true },
        { name: '🔒 /close', value: 'Fermer un ticket modmail', inline: true },
        { name: '🎮 /play', value: 'Lancer GTA VI', inline: true },
      )
      .setFooter({ text: 'Les actions sont enregistrées dans le système de cases.' });
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('mod_refresh').setLabel('Actualiser').setStyle(ButtonStyle.Secondary),
    );
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  },
};
