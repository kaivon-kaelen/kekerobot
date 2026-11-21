const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const ROLE_ID = '771347058942672927';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reglement')
    .setDescription('Envoyer l\'embed du règlement (admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x2f3136)
      .setTitle('Acceptez le règlement de ketotos pour accéder à l\'intégralité du serveur')
      .setDescription(
        '📘 **Règlement** Respect :\n' +
        '1. Le respect prime sur tout, on peut rigoler mais on reste respectueux avec et envers le monde.\n\n' +
        '⚠️ **NSFW 18** :\n' +
        '2. Pas de NSFW mais ça c\'est assez évident pas besoin normalement de vous le répétez\n\n' +
        '📧 **Spam** :\n' +
        '3. Pas de Spam\n\n' +
        '🎙️ **Vocal** :\n' +
        '4. Pas d\'abus en Vocal (dégradations sonores, etc...)\n\n' +
        '📢 **Pub** :\n' +
        '5. Toute Pub en MP tant que sur le serveur est interdite.\n\n' +
        '🇫🇷 **Politique** :\n' +
        '6. Tout sujet politique sera banni définitivement.\n\n' +
        'Pour accepter le règlement du serveur, veuillez interagir avec le bouton ci-dessous !'
      )
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('reglement_accept')
        .setLabel('Accepter le règlement')
        .setStyle(ButtonStyle.Success),
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
