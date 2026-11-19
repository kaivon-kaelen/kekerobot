const fs = require('node:fs');
const path = require('node:path');
const { EmbedBuilder } = require('discord.js');

const DATA_DIR = path.join(__dirname, '..', 'data');
const STATE_FILE = path.join(DATA_DIR, 'live-state.json');

const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const CHANNELS = (process.env.TWITCH_CHANNELS || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const ANNOUNCE_CHANNEL_ID = process.env.LIVE_CHANNEL_ID || '1369717395811336212';
const POLL_INTERVAL = Math.max(30000, Number(process.env.LIVE_POLL_INTERVAL_MS) || 120000);
const INITIAL_DELAY = Number(process.env.LIVE_INITIAL_DELAY_MS ?? 5000);

let token = null;
let tokenExpiresAt = 0;
let polling = false;
let clientRef = null;

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

async function getAppToken() {
  if (token && Date.now() < tokenExpiresAt) return token;

  const url = new URL('https://id.twitch.tv/oauth2/token');
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('client_secret', CLIENT_SECRET);
  url.searchParams.set('grant_type', 'client_credentials');

  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) throw new Error(`Twitch OAuth ${res.status}: ${await res.text()}`);
  const data = await res.json();
  token = data.access_token;
  // On renouvelle 1 minute avant l'expiration réelle
  tokenExpiresAt = Date.now() - 60000 + (data.expires_in || 3600) * 1000;
  return token;
}

async function getStreams(logins) {
  const accessToken = await getAppToken();
  const url = new URL('https://api.twitch.tv/helix/streams');
  for (const login of logins) url.searchParams.append('user_login', login);

  const res = await fetch(url, {
    headers: {
      'Client-ID': CLIENT_ID,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    if (res.status === 401) {
      token = null; // jeton périmé : on le régénérera au prochain tour
      tokenExpiresAt = 0;
    }
    throw new Error(`Twitch Helix ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return data.data || [];
}

function buildEmbed(stream) {
  const embed = new EmbedBuilder()
    .setColor(0x9146ff)
    .setTitle(`🔴 ${stream.user_name || stream.user_login} est en live !`)
    .setURL(`https://www.twitch.tv/${stream.user_login}`)
    .setDescription(stream.title || '(sans titre)')
    .addFields(
      { name: '🎮 Jeu', value: stream.game_name || 'Inconnu', inline: true },
      { name: '👥 Spectateurs', value: String(stream.viewer_count ?? 0), inline: true },
      {
        name: '⏲️ Depuis',
        value: `<t:${Math.floor(new Date(stream.started_at).getTime() / 1000)}:R>`,
        inline: true,
      },
    )
    .setTimestamp();

  if (stream.thumbnail_url) {
    embed.setImage(
      stream.thumbnail_url.replace('{width}', '1280').replace('{height}', '720'),
    );
  }
  return embed;
}

async function announce(stream) {
  let channel = clientRef.channels.cache.get(ANNOUNCE_CHANNEL_ID);
  if (!channel) {
    channel = await clientRef.channels.fetch(ANNOUNCE_CHANNEL_ID).catch(() => null);
  }
  if (!channel || !channel.isTextBased()) {
    console.error(`[live] Salon d'annonce introuvable ou non textuel : ${ANNOUNCE_CHANNEL_ID}`);
    return;
  }
  await channel.send({ embeds: [buildEmbed(stream)] }).catch((err) => {
    console.error('[live] Impossible d\'envoyer l\'annonce :', err?.message);
  });
}

async function poll() {
  if (polling) return;
  polling = true;
  try {
    const streams = await getStreams(CHANNELS);
    const liveByLogin = new Map(streams.map((s) => [s.user_login.toLowerCase(), s]));
    const state = loadState();
    let changed = false;

    for (const login of CHANNELS) {
      const stream = liveByLogin.get(login);
      const prev = state[login];

      if (stream) {
        const alreadyAnnounced = prev?.streamId === stream.id && prev.announced;
        if (!alreadyAnnounced) {
          await announce(stream);
          state[login] = {
            live: true,
            streamId: stream.id,
            announced: true,
            announcedAt: new Date().toISOString(),
            title: stream.title,
          };
          changed = true;
        } else if (!prev.live) {
          state[login] = { ...prev, live: true };
          changed = true;
        }
      } else if (prev?.live) {
        state[login] = { ...prev, live: false, endedAt: new Date().toISOString() };
        changed = true;
      }
    }

    if (changed) saveState(state);
  } catch (err) {
    console.error('[live] Vérification Twitch impossible :', err?.message);
  } finally {
    polling = false;
  }
}

function startLiveAnnouncer(client) {
  clientRef = client;
  if (!CLIENT_ID || !CLIENT_SECRET || !CHANNELS.length) {
    console.warn('[live] Annonces Twitch désactivées : renseigner TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET et TWITCH_CHANNELS.');
    return;
  }
  setTimeout(poll, INITIAL_DELAY);
  setInterval(poll, POLL_INTERVAL).unref();
  console.log(`[live] Surveillance Twitch active : ${CHANNELS.join(', ')} (salon ${ANNOUNCE_CHANNEL_ID}).`);
}

module.exports = { startLiveAnnouncer };
