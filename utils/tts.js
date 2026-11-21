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
const { Events } = require('discord.js');

const states = new Map(); // guildId -> { connection, player, voiceChannelId, queue: [], speaking: false }

function getState(guildId) {
  if (!states.has(guildId)) {
    states.set(guildId, {
      connection: null,
      player: null,
      voiceChannelId: null,
      queue: [],
      speaking: false,
    });
  }
  return states.get(guildId);
}

async function speak(guild, text) {
  const state = getState(guild.id);
  state.queue.push({ text });
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
  state.player.play(resource);
}

async function connect(guild, voiceChannelId) {
  const state = getState(guild.id);
  state.voiceChannelId = voiceChannelId;

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

function getVoiceChannel(guildId) {
  return getState(guildId).voiceChannelId;
}

module.exports = {
  speak,
  connect,
  leave,
  isConnected,
  getVoiceChannel,
};

// Auto-disconnect when bot is alone in voice channel
function setupAutoLeave(client) {
  client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;

    const state = getState(member.guild.id);
    if (!state.voiceChannelId) return;

    const vc = member.guild.channels.cache.get(state.voiceChannelId);
    if (!vc || !vc.isVoiceBased()) return;

    // Count non-bot members in the voice channel
    const humans = vc.members.filter((m) => !m.user.bot);
    if (humans.size === 0 && isConnected(member.guild.id)) {
      console.log('[TTS] Plus personne dans le vocal, déconnexion.');
      await leave(member.guild.id);
    }
  });
}

module.exports.setupAutoLeave = setupAutoLeave;
