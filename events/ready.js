const { Events, ActivityType } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
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
  },
};
