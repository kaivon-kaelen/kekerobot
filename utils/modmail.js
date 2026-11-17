const fs = require('node:fs');
const path = require('node:path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'modmail.json');

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '[]', 'utf8');
}

function load() {
  ensure();
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return []; }
}

function save(data) { ensure(); fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf8'); }

function getOpenByUser(userId) {
  return load().find((t) => t.userId === userId && t.open) || null;
}

function getOpenByThread(threadId) {
  return load().find((t) => t.threadId === threadId && t.open) || null;
}

function createTicket(userId, userTag, threadId) {
  const data = load();
  const ticket = { userId, userTag, threadId, open: true, createdAt: new Date().toISOString() };
  data.push(ticket);
  save(data);
  return ticket;
}

function closeTicket(threadId) {
  const data = load();
  const t = data.find((x) => x.threadId === threadId && x.open);
  if (!t) return null;
  t.open = false;
  t.closedAt = new Date().toISOString();
  save(data);
  return t;
}

module.exports = { getOpenByUser, getOpenByThread, createTicket, closeTicket, load };
