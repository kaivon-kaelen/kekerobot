const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { sendLog, modLogEmbed } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Faire parler le bot (admin)')
    .addStringOption((o) => o.setName('message').setDescription('Message à envoyer').setRequired(true))
    .addChannelOption((o) => o.setName('salon').setDescription('Salon cible (optionnel)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const text = interaction.options.getString('message');
    const channel = interaction.options.getChannel('salon') || interaction.channel;
    await channel.send(text);
    await interaction.reply({ content: `Message envoyé dans ${channel}.`, ephemeral: true });
    await sendLog(interaction.client, modLogEmbed({
      title: '💬 Say',
      color: 0x95a5a6,
      fields: [
        { name: 'Salon', value: `${channel}`, inline: true },
        { name: 'Admin', value: interaction.user.tag, inline: true },
        { name: 'Message', value: text.slice(0, 1024) },
      ],
    }));
  },
};
