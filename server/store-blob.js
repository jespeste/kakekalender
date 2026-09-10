const crypto = require('crypto');
const { put, get } = require('@vercel/blob');

const BLOB_PATHNAME = 'entries.json';

async function readEntries() {
  const result = await get(BLOB_PATHNAME, { access: 'private', useCache: false });
  if (!result) return [];
  const text = await new Response(result.stream).text();
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeEntries(entries) {
  await put(BLOB_PATHNAME, JSON.stringify(entries), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  });
}

async function listEntries() {
  const entries = await readEntries();
  return entries.sort((a, b) => a.date.localeCompare(b.date));
}

async function addEntry({ date, name, note }) {
  const entries = await readEntries();
  const entry = { id: crypto.randomUUID(), date, name, note: note || '' };
  entries.push(entry);
  await writeEntries(entries);
  return entry;
}

async function updateEntry(id, { date, name, note }) {
  const entries = await readEntries();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  entries[idx] = { ...entries[idx], date, name, note: note || '' };
  await writeEntries(entries);
  return entries[idx];
}

async function deleteEntry(id) {
  const entries = await readEntries();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  entries.splice(idx, 1);
  await writeEntries(entries);
  return true;
}

module.exports = { listEntries, addEntry, updateEntry, deleteEntry };
