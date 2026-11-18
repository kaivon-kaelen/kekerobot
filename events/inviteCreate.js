const { Events } = require('discord.js');
const { sendLog, modLogEmbed } = require('../utils/logger');

module.exports = {
  name: Events.InviteCreate,
  async execute(invite) {
    try {
      if (!invite) return;
      const embed = modLogEmbed({
        title: '🔗 Invitation créée',
        color: 0x5865f2,
        fields: [
          { name: 'Code', value: invite.code, inline: true },
          { name: 'Salon', value: invite.channel ? `${invite.channel}` : 'inconnu', inline: true },
          { name: 'Créateur', value: invite.inviter ? `${invite.inviter.tag} (${invite.inviter.id})` : 'inconnu', inline: true },
          { name: 'Max utilisations', value: `${invite.maxUses || '∞'}`, inline: true },
          { name: 'Expire', value: invite.expiresAt ? `<t:${Math.floor(invite.expiresAt.getTime() / 1000)}:R>` : 'jamais', inline: true },
        ],
      });
      await sendLog(invite.client ?? invite.guild?.client, embed);
    } catch (err) {
      console.error('[inviteCreate]', err?.message);
    }
  },
};