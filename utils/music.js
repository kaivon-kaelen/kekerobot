const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  StreamType,
} = require('@discordjs/voice');
const ytDlpExec = require('yt-dlp-exec');

const queues = new Map();

function getQueue(guildId) {
  if (!queues.has(guildId)) {
    queues.set(guildId, {
      connection: null,
      player: null,
      channelId: null,
      queue: [],
      playing: false,
      current: null,
    });
  }
  return queues.get(guildId);
}

function ensurePlayer(guild, voiceChannel, state) {
  if (!state.player) {
    state.player = createAudioPlayer();
    state.player.on(AudioPlayerStatus.Idle, () => {
      state.playing = false;
      state.current = null;
      playNext(guild, state).catch((err) => {
        console.error('[music] Erreur après la fin du morceau :', err?.message);
      });
    });
    state.player.on('error', (err) => {
      console.error('[music] Erreur du lecteur audio :', err?.message);
      state.player.stop();
    });
  }

  if (!state.connection || state.connection.state.status === VoiceConnectionStatus.Destroyed) {
    state.connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: false,
    });
  }
  state.channelId = voiceChannel.id;
  state.connection.subscribe(state.player);
  return state.connection;
}

async function getAudioStream(url) {
  // Récupérer les infos pour trouver le meilleur format audio
  const info = await ytDlpExec(url, { dumpSingleJson: true, noWarnings: true });
  const formats = (info.formats || []).filter((f) => f.audioonly && f.acodec !== 'none');
  formats.sort((a, b) => (b.abr || 0) - (a.abr || 0));
  const bestAudio = formats[0];

  // Stream audio directement depuis yt-dlp
  const stream = ytDlpExec.exec(url, {
    format: bestAudio.format_id,
    output: '-',
    quiet: true,
    noWarnings: true,
  });

  return { stream, title: info.title || 'Titre inconnu' };
}

async function playNext(guild, state) {
  const item = state.queue.shift();
  if (!item) {
    state.playing = false;
    state.current = null;
    return null;
  }

  if (!state.connection || state.connection.state.status === VoiceConnectionStatus.Destroyed) {
    const channel = guild.channels.cache.get(state.channelId);
    if (!channel || !channel.isVoiceBased()) {
      state.playing = false;
      return null;
    }
    joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
    });
  }

  try {
    await entersState(state.connection, VoiceConnectionStatus.Ready, 15000);
  } catch (err) {
    console.error('[music] Connexion vocale impossible :', err?.message);
    state.playing = false;
    return null;
  }

  try {
    const { stream, title } = await getAudioStream(item.url);
    const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });
    state.current = { ...item, title };
    state.playing = true;
    state.player.play(resource);
    return state.current;
  } catch (err) {
    console.error('[music] Impossible de lire le morceau :', err?.message);
    state.playing = false;
    if (state.queue.length) return playNext(guild, state);
    return null;
  }
}

async function enqueue(guild, voiceChannel, item) {
  const state = getQueue(guild.id);
  ensurePlayer(guild, voiceChannel, state);
  state.queue.push(item);
  if (!state.playing) {
    await playNext(guild, state);
    return { started: true, item };
  }
  return { started: false, item };
}

function skip(guildId) {
  const state = getQueue(guildId);
  if (!state.player || !state.playing) return false;
  state.player.stop();
  return true;
}

function stop(guildId) {
  const state = getQueue(guildId);
  state.queue.length = 0;
  if (state.player) state.player.stop();
  if (state.connection) {
    try { state.connection.destroy(); } catch {}
  }
  state.connection = null;
  state.player = null;
  state.playing = false;
  state.current = null;
  state.channelId = null;
  return true;
}

function pause(guildId) {
  const state = getQueue(guildId);
  if (!state.player || !state.playing) return false;
  state.player.pause();
  return true;
}

function resume(guildId) {
  const state = getQueue(guildId);
  if (!state.player || !state.playing) return false;
  state.player.unpause();
  return true;
}

function getQueueList(guildId) {
  const state = getQueue(guildId);
  return { current: state.current, items: [...state.queue] };
}

module.exports = { enqueue, playNext, skip, stop, pause, resume, getQueueList };
