const { Events, ChannelType } = require('discord.js');
const {
  getUserData,
  addXP,
  setLastXP,
  levelFromXP,
  xpNeededForCurrentLevel,
  xpForCurrentLevel,
  XP_COOLDOWN,
  XP_MIN,
  XP_MAX,
} = require('../utils/levels');

// Cooldowns en mémoire (userId -> timestamp) pour éviter d'accéder au disque à chaque message
const cooldowns = new Map();

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    try {
      if (!message || message.author.bot) return;
      if (message.channel.type === ChannelType.DM) return;
      if (!message.guild) return;

      const guildId = message.guild.id;
      const userId = message.author.id;

      // Vérification du cooldown
      const now = Date.now();
      const last = cooldowns.get(userId);
      if (last && now - last < XP_COOLDOWN) return;

      const xpGain = Math.floor(Math.random() * (XP_MAX - XP_MIN + 1)) + XP_MIN;
      const result = addXP(guildId, userId, message.author.tag, xpGain);
      if (!result) return;

      cooldowns.set(userId, now);
      setLastXP(guildId, userId);

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
          await channel.send(embed).catch(() => {});
        }
      }
    } catch (err) {
      console.error('[messageXP]', err?.message);
    }
  },
};