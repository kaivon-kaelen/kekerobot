const fs = require('node:fs');
const path = require('node:path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'levels.json');

// Cooldown entre deux gains d'XP (en ms) — évite le spam
const XP_COOLDOWN = 60 * 1000; // 1 minute
// XP gagné par message valide
const XP_MIN = 15;
const XP_MAX = 25;

// Cache en mémoire pour éviter de relire le fichier à chaque message
let cache = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 1000; // 5 secondes

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '{}', 'utf8');
}

function load() {
  ensure();
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return {};
  }
}

function save(data) {
  ensure();
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Calcule l'XP nécessaire pour atteindre le niveau suivant
function xpForLevel(level) {
  // Formule progressive : 5 * niveau^2 + 50 * niveau + 100
  return Math.floor(5 * (level ** 2) + 50 * level + 100);
}

// Calcule le niveau à partir d'un total d'XP
function levelFromXP(totalXP) {
  let level = 0;
  let needed = xpForLevel(level + 1);
  while (totalXP >= needed) {
    level += 1;
    needed = xpForLevel(level + 1);
  }
  return level;
}

// XP déjà accumulée pour le niveau actuel (pour la barre de progression)
function xpForCurrentLevel(totalXP) {
  const level = levelFromXP(totalXP);
  if (level === 0) return totalXP;
  return totalXP - xpForLevel(level);
}

// XP nécessaire pour passer au niveau suivant (de level à level+1)
function xpNeededForCurrentLevel(totalXP) {
  const level = levelFromXP(totalXP);
  return xpForLevel(level + 1) - xpForLevel(level);
}

function getUserData(guildId, userId) {
  const now = Date.now();
  if (cache && now - cacheTime < CACHE_TTL) {
    const d = cache[guildId];
    return d && d[userId] ? d[userId] : null;
  }
  cache = load();
  cacheTime = now;
  const d = cache[guildId];
  return d && d[userId] ? d[userId] : null;
}

function addXP(guildId, userId, userTag, xpAmount) {
  const data = load();
  if (!data[guildId]) data[guildId] = {};
  if (!data[guildId][userId]) {
    data[guildId][userId] = { userTag, xp: 0, level: 0, lastXP: 0, updatedAt: new Date().toISOString() };
  }
  const u = data[guildId][userId];
  u.userTag = userTag;
  u.xp += xpAmount;
  if (u.xp < 0) u.xp = 0;
  const oldLevel = u.level || 0;
  const newLevel = levelFromXP(u.xp);
  u.level = newLevel;
  u.updatedAt = new Date().toISOString();
  save(data);
  cache = null; // invalider le cache
  return { newLevel, oldLevel, xp: u.xp };
}

function setLastXP(guildId, userId) {
  const data = load();
  if (!data[guildId] || !data[guildId][userId]) return;
  data[guildId][userId].lastXP = Date.now();
  save(data);
  cache = null;
}

function getLeaderboard(guildId, limit = 10) {
  const data = load();
  const guild = data[guildId];
  if (!guild) return [];
  const entries = Object.entries(guild).map(([userId, u]) => ({
    userId,
    userTag: u.userTag || 'inconnu',
    xp: u.xp || 0,
    level: u.level || 0,
  }));
  entries.sort((a, b) => b.xp - a.xp);
  return entries.slice(0, limit);
}

function getRank(guildId, userId) {
  const lb = getLeaderboard(guildId, 1000);
  const idx = lb.findIndex((e) => e.userId === userId);
  return idx === -1 ? null : idx + 1;
}

module.exports = {
  ensure,
  load,
  save,
  xpForLevel,
  levelFromXP,
  xpForCurrentLevel,
  xpNeededForCurrentLevel,
  getUserData,
  addXP,
  setLastXP,
  getLeaderboard,
  getRank,
  XP_COOLDOWN,
  XP_MIN,
  XP_MAX,
};