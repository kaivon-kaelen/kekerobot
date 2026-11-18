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
      console.log(`[messageXP] level up détecté : ${message.author.tag} niveau ${oldLevel} → ${newLevel}`);
      if (newLevel > oldLevel) {
        const levelUpChannelId = process.env.LEVEL_UP_CHANNEL_ID || '1398594760427438230';
        let channel = message.client.channels.cache.get(levelUpChannelId);
        if (!channel) {
          try {
            channel = await message.client.channels.fetch(levelUpChannelId);
          } catch {}
        }
        if (!channel || !channel.isTextBased()) {
          console.warn(`[messageXP] Salon de level up introuvable ou non textuel : ${levelUpChannelId}`);
        } else {
          const levelEmbed = {
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
          try {
            await channel.send({ content: `${message.author}`, embeds: levelEmbed.embeds });
            console.log(`[messageXP] Annonce envoyée dans le salon ${levelUpChannelId}`);
          } catch (err) {
            console.error(`[messageXP] Impossible d'envoyer l'annonce dans le salon ${levelUpChannelId} :`, err?.message);
          }
        }
      }
    } catch (err) {
      console.error('[messageXP]', err?.message);
    }
  },
};