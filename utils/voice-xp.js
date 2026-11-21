const fs = require('node:fs');
const path = require('node:path');
const { addXP } = require('./levels');
const { EmbedBuilder } = require('discord.js');

const DATA_DIR = path.join(__dirname, '..', 'data');
const STATE_FILE = path.join(DATA_DIR, 'voice-xp-state.json');

// XP attribué à chaque tranche passée en vocal
const XP_PER_TICK = Number(process.env.VOICE_XP_PER_TICK) || 10;
// Durée d'une tranche (ms) — défaut 1 minute
const TICK_MS = Math.max(10000, Number(process.env.VOICE_XP_TICK_MS) || 60000);
// Ignorer les membres self-mute et/ou self-deaf (défaut : oui)
const IGNORE_MUTED = process.env.VOICE_XP_IGNORE_MUTED !== 'false';
const IGNORE_DEAFENED = process.env.VOICE_XP_IGNORE_DEAFENED !== 'false';

let intervalRef = null;
let running = false;

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveState(state) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

function isEligible(member, state, now) {
  if (!member || member.user?.bot) return false;
  if (!member.voice || !member.voice.channel) return false;
  if (IGNORE_MUTED && (member.voice.selfMute || member.voice.mute)) return false;
  if (IGNORE_DEAFENED && (member.voice.selfDeaf || member.voice.deaf)) return false;
  const lastAward = state[member.id] || 0;
  return now - lastAward >= TICK_MS;
}

async function awardTick(client) {
  const now = Date.now();
  const state = loadState();
  let changed = false;

  const levelUpChannelId = process.env.LEVEL_UP_CHANNEL_ID || '1398594760427438230';

  async function sendLevelUp(member, newLevel) {
    let channel = client.channels.cache.get(levelUpChannelId);
    if (!channel) {
      try {
        channel = await client.channels.fetch(levelUpChannelId);
      } catch {}
    }
    if (!channel || !channel.isTextBased()) return;
    const embed = new EmbedBuilder()
      .setTitle('🎉 Montée de niveau (vocal) !')
      .setDescription(`${member} est maintenant **niveau ${newLevel}** !`)
      .setColor(0x5865f2)
      .setTimestamp();
    try {
      await channel.send({ content: `${member}`, embeds: [embed] });
    } catch (err) {
      console.error('[voiceXP] Impossible d\'envoyer l\'annonce :', err?.message);
    }
  }

  for (const guild of client.guilds.cache.values()) {
    for (const member of guild.members.cache.values()) {
      if (!isEligible(member, state, now)) continue;
      try {
        const result = addXP(guild.id, member.id, member.user.tag, XP_PER_TICK);
        if (!result) continue;
        state[member.id] = now;
        changed = true;
        if (result.newLevel > result.oldLevel) {
          console.log(`[voiceXP] ${member.user.tag} est passé niveau ${result.newLevel} (via vocal)`);
          await sendLevelUp(member, result.newLevel);
        }
      } catch (err) {
        console.error('[voiceXP] Attribution impossible :', err?.message);
      }
    }
  }

  if (changed) saveState(state);
}

function startVoiceXP(client) {
  if (running) return;
  running = true;
  // Première attribution après une tranche complète (pas au démarrage)
  intervalRef = setInterval(() => {
    awardTick(client).catch((err) => {
      console.error('[voiceXP] Erreur pendant la tranche :', err?.message);
    });
  }, TICK_MS);
  console.log(
    `[voiceXP] Actif : +${XP_PER_TICK} XP toutes les ${Math.round(TICK_MS / 60000)} min en vocal ` +
    `(ignore mute=${IGNORE_MUTED}, deaf=${IGNORE_DEAFENED}).`,
  );
}

function stopVoiceXP() {
  if (intervalRef) clearInterval(intervalRef);
  intervalRef = null;
  running = false;
}

module.exports = { startVoiceXP, stopVoiceXP, awardTick };
