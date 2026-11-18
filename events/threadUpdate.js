const { Events } = require('discord.js');
const { sendLog, modLogEmbed } = require('../utils/logger');

module.exports = {
  name: Events.ThreadUpdate,
  async execute(oldThread, newThread) {
    try {
      if (!oldThread || !newThread) return;
      const changes = [];
      if (oldThread.name !== newThread.name) changes.push(`**Nom** : ${oldThread.name} → ${newThread.name}`);
      if (oldThread.archived !== newThread.archived) changes.push(`**Archivé** : ${oldThread.archived} → ${newThread.archived}`);
      if (oldThread.locked !== newThread.locked) changes.push(`**Verrouillé** : ${oldThread.locked} → ${newThread.locked}`);
      if (!changes.length) return;
      const embed = modLogEmbed({
        title: '✏️ Thread modifié',
        color: 0xfee75c,
        fields: [
          { name: 'Thread', value: `${newThread} (${newThread.id})`, inline: true },
          { name: 'Modifications', value: changes.join('\n').slice(0, 1024) },
        ],
      });
      await sendLog(newThread.client, embed);
    } catch (err) {
      console.error('[threadUpdate]', err?.message);
    }
  },
};