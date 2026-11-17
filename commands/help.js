const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Affiche la liste des commandes disponibles.'),
  async execute(interaction) {
    const commands = interaction.client.commands.map((c) => `\`/${c.data.name}\` — ${c.data.description}`).join('\n');
    const embed = new EmbedBuilder()
      .setTitle('Commandes disponibles')
      .setDescription(commands || 'Aucune commande.')
      .setColor(0x5865f2);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
