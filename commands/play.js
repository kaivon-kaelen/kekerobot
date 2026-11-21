const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { enqueue } = require('../utils/music');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Jouer une vidéo YouTube en vocal')
    .addStringOption((o) =>
      o.setName('lien').setDescription('Lien YouTube').setRequired(true),
    ),
  async execute(interaction) {
    const url = interaction.options.getString('lien').trim();

    const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}(\S*)?$/;
    if (!ytRegex.test(url)) {
      return interaction.reply({
        content: 'Ce lien n\'est pas une vidéo YouTube valide.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: 'Tu dois être connecté à un salon vocal pour lancer une musique.',
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply();

    try {
      const result = await enqueue(interaction.guild, voiceChannel, {
        url,
        title: 'Chargement...',
        requestedBy: interaction.user.tag,
      });

      const embed = new EmbedBuilder()
        .setTitle(result.started ? '🎵 Lecture en cours' : '📝 Ajouté à la file')
        .setDescription(`**${result.item.title}**`)
        .addFields(
          { name: 'Demandé par', value: result.item.requestedBy, inline: true },
          { name: 'Salon vocal', value: `${voiceChannel}`, inline: true },
        )
        .setColor(0x5865f2)
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('[play]', err?.message);
      return interaction.editReply('Impossible de lancer la lecture pour le moment.');
    }
  },
};
