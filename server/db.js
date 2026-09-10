const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'entries.json');

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  }
}

function readEntries() {
  ensureStore();
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeEntries(entries) {
  ensureStore();
  const tmpFile = `${DATA_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(entries, null, 2), 'utf8');
  fs.renameSync(tmpFile, DATA_FILE);
}

function listEntries() {
  return readEntries().sort((a, b) => a.date.localeCompare(b.date));
}

function addEntry({ date, name, note }) {
  const entries = readEntries();
  const entry = { id: crypto.randomUUID(), date, name, note: note || '' };
  entries.push(entry);
  writeEntries(entries);
  return entry;
}

function updateEntry(id, { date, name, note }) {
  const entries = readEntries();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  entries[idx] = { ...entries[idx], date, name, note: note || '' };
  writeEntries(entries);
  return entries[idx];
}

function deleteEntry(id) {
  const entries = readEntries();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  entries.splice(idx, 1);
  writeEntries(entries);
  return true;
}

module.exports = { listEntries, addEntry, updateEntry, deleteEntry };
