const path = require('path');
const crypto = require('crypto');
const express = require('express');
const cookieSession = require('cookie-session');
const db = require('./db');

const PORT = process.env.PORT || 3000;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'fernande';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

if (!ADMIN_PASSWORD) {
  console.warn('ADVARSEL: ADMIN_PASSWORD er ikke satt. Admin-innlogging vil ikke fungere før den er konfigurert.');
}
if (!process.env.SESSION_SECRET) {
  console.warn('ADVARSEL: SESSION_SECRET er ikke satt. Innloggingsøkter tilbakestilles ved omstart.');
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  const paddedA = Buffer.alloc(Math.max(bufA.length, bufB.length));
  const paddedB = Buffer.alloc(Math.max(bufA.length, bufB.length));
  bufA.copy(paddedA);
  bufB.copy(paddedB);
  return bufA.length === bufB.length && crypto.timingSafeEqual(paddedA, paddedB);
}

const app = express();
app.disable('x-powered-by');
app.use(express.json());
app.use(
  cookieSession({
    name: 'kakekalender_session',
    keys: [SESSION_SECRET],
    maxAge: 30 * 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' && process.env.TRUST_PROXY_SECURE === 'true',
  })
);

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(401).json({ error: 'Krever admin-innlogging' });
}

function asyncHandler(fn) {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

function validEntryBody(body) {
  return (
    body &&
    typeof body.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(body.date) &&
    typeof body.name === 'string' &&
    body.name.trim().length > 0 &&
    (body.note === undefined || typeof body.note === 'string')
  );
}

app.get('/api/me', (req, res) => {
  res.json({ isAdmin: Boolean(req.session && req.session.isAdmin) });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  const ok =
    typeof username === 'string' &&
    typeof password === 'string' &&
    ADMIN_PASSWORD.length > 0 &&
    safeEqual(username, ADMIN_USERNAME) &&
    safeEqual(password, ADMIN_PASSWORD);

  if (!ok) {
    return res.status(401).json({ error: 'Feil brukernavn eller passord' });
  }
  req.session.isAdmin = true;
  res.json({ isAdmin: true });
});

app.post('/api/logout', (req, res) => {
  req.session = null;
  res.json({ isAdmin: false });
});

app.get(
  '/api/entries',
  asyncHandler(async (req, res) => {
    res.json(await db.listEntries());
  })
);

app.post(
  '/api/entries',
  requireAdmin,
  asyncHandler(async (req, res) => {
    if (!validEntryBody(req.body)) {
      return res.status(400).json({ error: 'Dato og navn er påkrevd' });
    }
    res.status(201).json(await db.addEntry(req.body));
  })
);

app.put(
  '/api/entries/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    if (!validEntryBody(req.body)) {
      return res.status(400).json({ error: 'Dato og navn er påkrevd' });
    }
    const entry = await db.updateEntry(req.params.id, req.body);
    if (!entry) return res.status(404).json({ error: 'Fant ikke oppføring' });
    res.json(entry);
  })
);

app.delete(
  '/api/entries/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const ok = await db.deleteEntry(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Fant ikke oppføring' });
    res.status(204).end();
  })
);

app.use(express.static(path.join(__dirname, '..', 'public')));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Noe gikk galt' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Kakekalender kjører på port ${PORT}`);
  });
}

module.exports = app;
