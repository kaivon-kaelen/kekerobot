const { Events, ActivityType } = require('discord.js');
const { announceUpdate } = require('../utils/changelog');
const { startLiveAnnouncer } = require('../utils/live-announcer');
const { startVoiceXP } = require('../utils/voice-xp');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`Bot connecté en tant que ${client.user.tag}`);
    console.log(`Présent sur ${client.guilds.cache.size} serveur(s).`);

    client.user.setPresence({
      activities: [
        {
          name: 'GTA VI',
          type: ActivityType.Playing,
          buttons: [{ label: 'Jouer', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }],
        },
        {
          name: 'Custom',
          type: ActivityType.Custom,
          state: 'allez vous faire foutre',
        },
      ],
      status: 'online',
    });

    // Annoncer la mise à jour si la version de l'image a changé
    await announceUpdate(client).catch((err) => {
      console.error('[ready] Annonce de mise à jour impossible :', err?.message);
    });

    // Surveillance des lives Twitch
    startLiveAnnouncer(client);

    // XP passif en vocal
    startVoiceXP(client);
  },
};
