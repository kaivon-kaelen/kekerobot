const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Lancer GTA VI'),
  async execute(interaction) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Jouer')
        .setStyle(ButtonStyle.Link)
        .setURL('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    );
    const embed = new EmbedBuilder()
      .setTitle('🎮 GTA VI')
      .setDescription('Cliquez sur le bouton pour jouer.')
      .setColor(0x5865f2);
    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
