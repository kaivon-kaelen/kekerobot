const { Events } = require('discord.js');
const { sendLog, modLogEmbed } = require('../utils/logger');

module.exports = {
  name: Events.InviteDelete,
  async execute(invite) {
    try {
      if (!invite) return;
      const embed = modLogEmbed({
        title: '🗑️ Invitation supprimée',
        color: 0xed4245,
        fields: [
          { name: 'Code', value: invite.code, inline: true },
          { name: 'Salon', value: invite.channel ? `${invite.channel}` : 'inconnu', inline: true },
        ],
      });
      await sendLog(invite.client ?? invite.guild?.client, embed);
    } catch (err) {
      console.error('[inviteDelete]', err?.message);
    }
  },
};