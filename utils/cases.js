const fs = require('node:fs');
const path = require('node:path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CASES_FILE = path.join(DATA_DIR, 'cases.json');

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(CASES_FILE)) fs.writeFileSync(CASES_FILE, '[]', 'utf8');
}

function load() {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(CASES_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function save(cases) {
  ensureFile();
  fs.writeFileSync(CASES_FILE, JSON.stringify(cases, null, 2), 'utf8');
}

let counter = null;
function nextId() {
  const cases = load();
  if (counter === null) counter = cases.reduce((m, c) => Math.max(m, c.id || 0), 0);
  counter += 1;
  return counter;
}

function addCase({ type, guildId, userId, userTag, moderatorId, moderatorTag, reason }) {
  const cases = load();
  const c = {
    id: nextId(),
    type,
    guildId,
    userId,
    userTag,
    moderatorId,
    moderatorTag,
    reason: reason || 'Aucune raison fournie',
    timestamp: new Date().toISOString(),
  };
  cases.push(c);
  save(cases);
  return c;
}

function getCase(id) {
  return load().find((c) => c.id === id) || null;
}

function listCases({ guildId, userId, limit = 10 }) {
  let cases = load().filter((c) => c.guildId === guildId);
  if (userId) cases = cases.filter((c) => c.userId === userId);
  return cases.slice(-limit).reverse();
}

function countWarns(guildId, userId) {
  return load().filter((c) => c.guildId === guildId && c.userId === userId && c.type === 'WARN' && !c.removed).length;
}

function removeWarn(caseId, moderatorTag, moderatorId) {
  const cases = load();
  const idx = cases.findIndex((c) => c.id === caseId && c.type === 'WARN');
  if (idx === -1) return null;
  if (cases[idx].removed) return null;
  cases[idx].removed = true;
  cases[idx].removedBy = moderatorTag;
  cases[idx].removedById = moderatorId;
  cases[idx].removedAt = new Date().toISOString();
  save(cases);
  return cases[idx];
}

function getActiveWarns(guildId, userId) {
  return load().filter((c) => c.guildId === guildId && c.userId === userId && c.type === 'WARN' && !c.removed);
}

function getLastWarn(guildId, userId) {
  const warns = getActiveWarns(guildId, userId);
  if (!warns.length) return null;
  return warns[warns.length - 1];
}

module.exports = { addCase, getCase, listCases, countWarns, removeWarn, getActiveWarns, getLastWarn };
