const fs = require('node:fs');
const path = require('node:path');
const { EmbedBuilder } = require('discord.js');

// Salon de mise à jour (peut être surchargé via CHANGELOG_CHANNEL_ID dans .env)
const DEFAULT_CHANNEL_ID = '1369717395811336212';
const CHANNEL_ID = process.env.CHANGELOG_CHANNEL_ID || DEFAULT_CHANNEL_ID;
const REPO_URL = 'https://github.com/kaivon-kaelen/kekerobot';

const CHANGELOG_FILE = path.join(__dirname, '..', 'CHANGELOG.json');
const DATA_DIR = path.join(__dirname, '..', 'data');
const STATE_FILE = path.join(DATA_DIR, 'changelog-state.json');
const MAX_DESCRIPTION = 3500;

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function saveState(version) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(
    STATE_FILE,
    JSON.stringify({ version, announcedAt: new Date().toISOString() }, null, 2),
    'utf8',
  );
}

// Retourne les commits de la mise à jour, ou null si la version est déjà annoncée
function getPendingUpdate() {
  const changelog = readJson(CHANGELOG_FILE, null);
  if (!changelog || !changelog.version || !Array.isArray(changelog.commits)) return null;

  const state = readJson(STATE_FILE, null);
  if (state?.version === changelog.version) return null;

  const lastIndex = changelog.commits.findIndex((c) => c.sha === state?.version);
  const commits = lastIndex === -1
    ? changelog.commits
    : changelog.commits.slice(lastIndex + 1);

  return { version: changelog.version, commits };
}

function formatCommit(commit) {
  const sha = (commit.sha || '').slice(0, 7);
  const link = commit.sha ? `[${sha}](${REPO_URL}/commit/${commit.sha})` : sha;
  const rawMessage = (commit.message || '(sans message)').trim();
  const lines = rawMessage.split('\n').map((l) => l.trim()).filter(Boolean);
  const title = lines.shift() || '(sans message)';
  const body = lines.length ? `\n${lines.map((l) => `   ${l}`).join('\n')}` : '';
  const author = commit.author ? ` · ${commit.author}` : '';
  return `- ${link} ${title}${body}${author}`;
}

function splitCommits(commits) {
  const chunks = [];
  let current = '';

  for (const commit of commits) {
    let line = formatCommit(commit);
    if (line.length > MAX_DESCRIPTION) {
      line = `${line.slice(0, MAX_DESCRIPTION - 3)}...`;
    }
    const next = current ? `${current}\n\n${line}` : line;
    if (next.length > MAX_DESCRIPTION && current) {
      chunks.push(current);
      current = line;
    } else {
      current = next;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function buildEmbeds(update) {
  const shortVersion = update.version.slice(0, 7);
  return splitCommits(update.commits).map((chunk, index, all) =>
    new EmbedBuilder()
      .setTitle(index === 0 ? `🚀 Mise à jour du bot — ${update.commits.length} modification(s)` : '🚀 Changelog (suite)')
      .setDescription(chunk)
      .setColor(0x5865f2)
      .setFooter({ text: `Version ${shortVersion} — ${index + 1}/${all.length}` })
      .setTimestamp(),
  );
}

async function announceUpdate(client) {
  const update = getPendingUpdate();
  if (!update) return;

  const channel = await client.channels.fetch(CHANNEL_ID).catch(() => null);
  if (!channel || !channel.isTextBased() || typeof channel.send !== 'function') {
    console.error(`[changelog] Salon ${CHANNEL_ID} introuvable ou non textuel.`);
    return;
  }

  try {
    if (update.commits.length) {
      for (const embed of buildEmbeds(update)) {
        await channel.send({ embeds: [embed] });
      }
    }
    saveState(update.version);
    console.log(`[changelog] Mise à jour ${update.version.slice(0, 7)} annoncée (${update.commits.length} commit(s)).`);
  } catch (err) {
    console.error('[changelog] Impossible d\'annoncer la mise à jour :', err?.message);
  }
}

module.exports = { announceUpdate, CHANNEL_ID };
