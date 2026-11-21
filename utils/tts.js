const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  StreamType,
} = require('@discordjs/voice');
const tts = require('google-tts-api');
const { Readable } = require('node:stream');
const fs = require('node:fs');
const path = require('node:path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'tts-config.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(CONFIG_FILE)) fs.writeFileSync(CONFIG_FILE, '{}', 'utf8');
}

function loadConfig() {
  ensureDir();
  try { return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); } catch { return {}; }
}

function saveConfig(config) {
  ensureDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}

function getTextChannel(guildId) {
  return (loadConfig()[guildId] || {}).textChannelId || null;
}

function setTextChannel(guildId, channelId) {
  const config = loadConfig();
  if (!config[guildId]) config[guildId] = {};
  config[guildId].textChannelId = channelId;
  saveConfig(config);
}

function removeTextChannel(guildId) {
  const config = loadConfig();
  if (config[guildId]) delete config[guildId].textChannelId;
  saveConfig(config);
}

const states = new Map(); // guildId -> { connection, player, voiceChannelId, textChannelId, queue: [], speaking: false }

function getState(guildId) {
  if (!states.has(guildId)) {
    states.set(guildId, {
      connection: null,
      player: null,
      voiceChannelId: null,
      textChannelId: null,
      queue: [],
      speaking: false,
    });
  }
  return states.get(guildId);
}

async function speak(guild, text, textChannelId) {
  const state = getState(guild.id);
  state.queue.push({ text, textChannelId });
  if (!state.speaking) {
    state.speaking = true;
    await processQueue(guild, state);
  }
}

async function processQueue(guild, state) {
  if (state.queue.length === 0) {
    state.speaking = false;
    return;
  }

  const item = state.queue.shift();

  // Ensure voice connection
  if (!state.connection || state.connection.state.status === VoiceConnectionStatus.Destroyed) {
    const vc = guild.channels.cache.get(state.voiceChannelId);
    if (!vc || !vc.isVoiceBased()) {
      state.speaking = false;
      await processQueue(guild, state);
      return;
    }
    state.connection = joinVoiceChannel({
      channelId: vc.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: false,
    });
    state.player = createAudioPlayer();
    state.player.on(AudioPlayerStatus.Idle, () => {
      // Continue queue
      setImmediate(() => processQueue(guild, state));
    });
    state.player.on('error', (err) => {
      console.error('[TTS] Erreur joueur audio :', err?.message);
      state.player.stop();
      setImmediate(() => processQueue(guild, state));
    });
    state.connection.subscribe(state.player);
    try {
      await entersState(state.connection, VoiceConnectionStatus.Ready, 15000);
    } catch (err) {
      console.error('[TTS] Connexion vocale impossible :', err?.message);
      state.speaking = false;
      return;
    }
  }

  // Generate TTS audio URL
  let audioUrl;
  try {
    audioUrl = tts.getAudioUrl(item.text, { lang: 'fr-FR', slow: false, host: 'https://translate.google.com' });
  } catch (err) {
    console.error('[TTS] Erreur génération audio :', err?.message);
    state.speaking = false;
    await processQueue(guild, state);
    return;
  }

  // Fetch audio stream
  let response;
  try {
    response = await fetch(audioUrl);
  } catch (err) {
    console.error('[TTS] Erreur fetch audio :', err?.message);
    state.speaking = false;
    await processQueue(guild, state);
    return;
  }

  const nodeStream = Readable.fromWeb(response.body);
  const resource = createAudioResource(nodeStream, { inputType: StreamType.Arbitrary });

  state.currentTextChannel = item.textChannelId;
  state.player.play(resource);
}

async function connect(guild, voiceChannelId, textChannelId) {
  const state = getState(guild.id);
  state.voiceChannelId = voiceChannelId;
  if (textChannelId) state.textChannelId = textChannelId;

  if (state.connection && state.connection.state.status === VoiceConnectionStatus.Ready) {
    return state;
  }

  const vc = guild.channels.cache.get(voiceChannelId);
  if (!vc || !vc.isVoiceBased()) {
    throw new Error('Salon vocal introuvable');
  }

  state.connection = joinVoiceChannel({
    channelId: vc.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: false,
    selfMute: false,
  });
  state.player = createAudioPlayer();
  state.player.on(AudioPlayerStatus.Idle, () => {
    setImmediate(() => processQueue(guild, state));
  });
  state.player.on('error', (err) => {
    console.error('[TTS] Erreur joueur audio :', err?.message);
    state.player.stop();
    setImmediate(() => processQueue(guild, state));
  });
  state.connection.subscribe(state.player);

  try {
    await entersState(state.connection, VoiceConnectionStatus.Ready, 15000);
  } catch (err) {
    console.error('[TTS] Connexion vocale impossible :', err?.message);
    throw err;
  }

  return state;
}

function join(guild, voiceChannelId, textChannelId) {
  const state = getState(guild.id);
  state.voiceChannelId = voiceChannelId;
  if (textChannelId) state.textChannelId = textChannelId;
  return state;
}

async function leave(guildId) {
  const state = getState(guildId);
  if (state.connection) {
    try { state.connection.destroy(); } catch {}
    state.connection = null;
  }
  state.player = null;
  state.queue = [];
  state.speaking = false;
  state.voiceChannelId = null;
}

function isConnected(guildId) {
  const state = getState(guildId);
  return Boolean(state.connection && state.connection.state.status === VoiceConnectionStatus.Ready);
}

function getQueue(guildId) {
  return getState(guildId).queue;
}

module.exports = {
  speak,
  join,
  connect,
  leave,
  isConnected,
  getQueue,
  getTextChannel,
  setTextChannel,
  removeTextChannel,
  getState,
};
