const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const { sendLog, modLogEmbed } = require('../utils/logger');

// Messages de plus de 14 jours ne peuvent pas être supprimés en masse (limite Discord)
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Supprimer des messages dans le salon')
    .addIntegerOption((o) => o.setName('amount').setDescription('Nombre de messages (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption((o) => o.setName('user').setDescription('Filtrer par utilisateur'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const amount = interaction.options.getInteger('amount');
    const filterUser = interaction.options.getUser('user');

    try {
      const messages = await interaction.channel.messages.fetch({ limit: amount });
      let toDelete = messages;
      if (filterUser) {
        toDelete = messages.filter((m) => m.author.id === filterUser.id);
      }

      // Filtrer les messages trop vieux (> 14 jours) pour respecter la limite Discord
      const now = Date.now();
      const deletable = toDelete.filter((m) => now - m.createdTimestamp < FOURTEEN_DAYS_MS);

      if (deletable.size === 0) {
        return interaction.editReply({ content: 'Aucun message supprimable (tous les messages ont plus de 14 jours ou le salon est vide).' });
      }

      const deleted = await interaction.channel.bulkDelete(deletable, true);
      const count = deleted ? deleted.size : 0;

      await interaction.editReply(`🗑️ ${count} message(s) supprimé(s).`);
      await sendLog(interaction.client, modLogEmbed({
        title: '🗑️ Purge',
        color: 0x95a5a6,
        fields: [
          { name: 'Salon', value: `${interaction.channel}`, inline: true },
          { name: 'Modérateur', value: interaction.user.tag, inline: true },
          { name: 'Nombre', value: `${count}`, inline: true },
          { name: 'Filtre', value: filterUser ? filterUser.tag : 'Aucun' },
        ],
      }));
    } catch (err) {
      console.error('[purge]', err?.message);
      await interaction.editReply({ content: 'Erreur lors de la suppression des messages.', flags: MessageFlags.Ephemeral });
    }
  },
};