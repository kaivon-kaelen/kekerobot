const { Events } = require('discord.js');
const { sendLog, modLogEmbed } = require('../utils/logger');

module.exports = {
  name: Events.GuildMemberUpdate,
  async execute(oldMember, newMember) {
    try {
      if (!oldMember || !newMember || newMember.user?.bot) return;

      const changes = [];
      if (oldMember.nickname !== newMember.nickname) {
        changes.push(`**Surnom** : ${oldMember.nickname || '(aucun)'} → ${newMember.nickname || '(aucun)'}`);
      }
      const added = newMember.roles.cache.filter((r) => !oldMember.roles.cache.has(r.id));
      const removed = oldMember.roles.cache.filter((r) => !newMember.roles.cache.has(r.id));
      if (added.size) changes.push(`**Rôles ajoutés** : ${added.map((r) => r.name).join(', ')}`);
      if (removed.size) changes.push(`**Rôles retirés** : ${removed.map((r) => r.name).join(', ')}`);

      // Timeout (communication disabled)
      const oldTimeout = oldMember.communicationDisabledUntil?.getTime() ?? null;
      const newTimeout = newMember.communicationDisabledUntil?.getTime() ?? null;
      if (oldTimeout !== newTimeout) {
        if (newTimeout && newTimeout > Date.now()) {
          const until = `<t:${Math.floor(newTimeout / 1000)}:R>`;
          changes.push(`**Timeout donné** jusqu'à ${until}`);
        } else {
          changes.push(`**Timeout retiré**`);
        }
      }

      if (!changes.length) return;
      const embed = modLogEmbed({
        title: '✏️ Membre modifié',
        color: 0x5865f2,
        fields: [
          { name: 'Utilisateur', value: `${newMember.user.tag} (${newMember.id})`, inline: true },
          { name: 'Modifications', value: changes.join('\n').slice(0, 1024) },
        ],
      });
      await sendLog(newMember.client, embed);
    } catch (err) {
      console.error('[guildMemberUpdate]', err?.message);
    }
  },
};