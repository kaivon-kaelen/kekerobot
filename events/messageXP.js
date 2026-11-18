const { Events, ChannelType } = require('discord.js');
const {
  addXP,
  levelFromXP,
} = require('../utils/levels');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    try {
      if (!message || message.author.bot) return;
      if (message.channel.type === ChannelType.DM) return;
      if (!message.guild) return;

      const guildId = message.guild.id;
      const userId = message.author.id;

      // XP gagné par message (sans cooldown)
      const xpGain = Math.floor(Math.random() * (25 - 15 + 1)) + 15;
      const result = addXP(guildId, userId, message.author.tag, xpGain);
      if (!result) return;

      // Détection d'un level up
      const oldLevel = result.oldLevel;
      const newLevel = result.newLevel;
      if (newLevel > oldLevel) {
        const levelUpChannelId = process.env.LEVEL_UP_CHANNEL_ID || '1398594760427438230';
        const channel = message.client.channels.cache.get(levelUpChannelId);
        if (!channel || !channel.isTextBased()) {
          console.warn(`[messageXP] Salon de level up introuvable : ${levelUpChannelId}`);
        } else {
          const embed = {
            embeds: [
              {
                title: '🎉 Montée de niveau !',
                description: `${message.author} est maintenant **niveau ${newLevel}** !`,
                color: 0x5865f2,
                timestamp: new Date().toISOString(),
                footer: { text: 'Continuez à discuter pour monter de niveau !' },
              },
            ],
          };
          await channel.send({ content: `${message.author}`, embeds: [embed] }).catch(() => {});
        }
      }
    } catch (err) {
      console.error('[messageXP]', err?.message);
    }
  },
};