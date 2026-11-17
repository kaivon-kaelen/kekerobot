const fs = require('node:fs');
const path = require('node:path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'modmail-messages.json');

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '[]', 'utf8');
}

function load() {
  ensure();
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return []; }
}

function save(data) { ensure(); fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf8'); }

function addMapping(userMessageId, threadMessageId, threadId, userId) {
  const data = load();
  data.push({ userMessageId, threadMessageId, threadId, userId });
  save(data);
}

function getMappingByUserMessage(userMessageId) {
  return load().find((x) => x.userMessageId === userMessageId) || null;
}

function getMappingByThreadMessage(threadMessageId) {
  return load().find((x) => x.threadMessageId === threadMessageId) || null;
}

function getThreadMessage(userMessageId) {
  const m = getMappingByUserMessage(userMessageId);
  return m ? m.threadMessageId : null;
}

function getUserMessage(threadMessageId) {
  const m = getMappingByThreadMessage(threadMessageId);
  return m ? m.userMessageId : null;
}

function getThreadIdByMessage(userMessageId) {
  const m = load().find((x) => x.userMessageId === userMessageId);
  return m ? m.threadId : null;
}

module.exports = { addMapping, getThreadMessage, getUserMessage, getThreadIdByMessage, getMappingByUserMessage, getMappingByThreadMessage };
