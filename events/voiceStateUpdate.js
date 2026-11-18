const { Events } = require('discord.js');
const { sendLog, modLogEmbed } = require('../utils/logger');

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
    try {
      const member = newState.member || oldState.member;
      if (!member || member.user?.bot) return;

      const user = `${member.user.tag} (${member.id})`;
      const oldCh = oldState.channel;
      const newCh = newState.channel;

      // Joined a voice channel
      if (!oldCh && newCh) {
        const embed = modLogEmbed({
          title: '🔊 Membre rejoint un salon vocal',
          color: 0x57f287,
          fields: [
            { name: 'Utilisateur', value: user, inline: true },
            { name: 'Salon', value: `${newCh}`, inline: true },
          ],
        });
        return sendLog(member.client, embed);
      }

      // Left a voice channel
      if (oldCh && !newCh) {
        const embed = modLogEmbed({
          title: '🔇 Membre a quitté un salon vocal',
          color: 0xed4245,
          fields: [
            { name: 'Utilisateur', value: user, inline: true },
            { name: 'Salon', value: `${oldCh}`, inline: true },
          ],
        });
        return sendLog(member.client, embed);
      }

      // Moved between voice channels
      if (oldCh && newCh && oldCh.id !== newCh.id) {
        const embed = modLogEmbed({
          title: '🔀 Membre déplacé entre salons vocaux',
          color: 0xfee75c,
          fields: [
            { name: 'Utilisateur', value: user, inline: true },
            { name: 'De', value: `${oldCh}`, inline: true },
            { name: 'Vers', value: `${newCh}`, inline: true },
          ],
        });
        return sendLog(member.client, embed);
      }

      // Mute / Deafen state changes
      const changes = [];
      if (oldState.selfMute !== newState.selfMute) changes.push(`Self-mute : ${oldState.selfMute} → ${newState.selfMute}`);
      if (oldState.selfDeaf !== newState.selfDeaf) changes.push(`Self-deaf : ${oldState.selfDeaf} → ${newState.selfDeaf}`);
      if (oldState.serverMute !== newState.serverMute) changes.push(`Server-mute : ${oldState.serverMute} → ${newState.serverMute}`);
      if (oldState.serverDeaf !== newState.serverDeaf) changes.push(`Server-deaf : ${oldState.serverDeaf} → ${newState.serverDeaf}`);
      if (changes.length) {
        const embed = modLogEmbed({
          title: '🔇 État vocal modifié (mute/deafen)',
          color: 0x95a5a6,
          fields: [
            { name: 'Utilisateur', value: user, inline: true },
            { name: 'Salon', value: `${newCh}`, inline: true },
            { name: 'Modifications', value: changes.join('\n').slice(0, 1024) },
          ],
        });
        return sendLog(member.client, embed);
      }
    } catch (err) {
      console.error('[voiceStateUpdate]', err?.message);
    }
  },
};