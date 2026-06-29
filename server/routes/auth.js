const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const { getClient } = require('../lib/descopeClient');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 64 * 1024 } });
const LEGACY_CSV_PATH = path.join(__dirname, '../../data/legacy-users.csv');

const MOCK_ACCOUNTS = [
  { actor: 'joel',  name: 'Joel',  password: 'ClearBank@2024' },
  { actor: 'alex',  name: 'Alex',  password: 'ClearBank@2024' },
  { actor: 'vicky', name: 'Vicky', password: 'ClearBank@2024' },
  { actor: 'admin', name: 'Admin', password: 'Admin@2024' },
];

// POST /api/verify/mock-login — local mode credential check (no Descope required)
router.post('/mock-login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.json({ success: false, error: 'Email and password are required.' });
  const base = process.env.BASE_EMAIL || '';
  const account = MOCK_ACCOUNTS.find(a => {
    const derived = base ? base.replace('@', `+${a.actor}@`) : `${a.actor}@mock.dev`;
    return email === derived && password === a.password;
  });
  if (!account) return res.json({ success: false, error: 'Invalid email or password.' });
  return res.json({ success: true, data: { name: account.name, email, userId: `mock-${account.actor}`, actor: account.actor } });
});

function parseCsv(raw) {
  const lines = raw.trim().split('\n').slice(1); // skip header
  return lines.map(line => {
    const [actor, displayName, password] = line.split(',').map(s => s.trim());
    return { actor, displayName, password };
  }).filter(u => u.actor && u.password);
}

function readLegacyUsers() {
  return parseCsv(fs.readFileSync(LEGACY_CSV_PATH, 'utf8'));
}

// POST /api/verify/m1-upload — accept CSV, hash passwords, return preview, save to disk
router.post('/m1-upload', upload.single('csv'), async (req, res) => {
  try {
    if (!req.file) return res.json({ success: false, error: 'No file uploaded.' });
    const raw = req.file.buffer.toString('utf8');
    const users = parseCsv(raw);
    if (!users.length) return res.json({ success: false, error: 'CSV is empty or malformed. Expected columns: actor,displayName,password' });
    const preview = await Promise.all(users.map(async ({ actor, displayName, password }) => ({
      actor,
      displayName,
      email: deriveEmail(actor) || actor,
      hash: await bcrypt.hash(password, 10),
    })));
    // Persist for m1-import to use
    const csv = ['actor,displayName,password', ...users.map(u => `${u.actor},${u.displayName},${u.password}`)].join('\n');
    fs.writeFileSync(LEGACY_CSV_PATH, csv, 'utf8');
    return res.json({ success: true, data: { users: preview } });
  } catch (err) {
    console.error('[verify/m1-upload]', err.message);
    return res.json({ success: false, error: err.message || 'Upload failed' });
  }
});

function deriveEmail(actor) {
  const base = process.env.BASE_EMAIL || '';
  if (!base) return null;
  return base.replace('@', `+${actor}@`);
}

function noClient(res) {
  return res.json({ success: false, error: 'Descope not configured — set Project ID and Management Key first (Missions 1 and 3)' });
}

// POST /api/verify/session
router.post('/session', async (req, res) => {
  try {
    const { sessionToken } = req.body;
    if (!sessionToken) return res.json({ success: false, error: 'sessionToken is required' });
    const client = getClient();
    if (!client) return noClient(res);
    const result = await client.validateSession(sessionToken);
    return res.json({ success: true, data: result?.token || result });
  } catch (err) {
    console.error('[verify/session]', err.message);
    return res.json({ success: false, error: err.message || 'Session validation failed' });
  }
});

// POST /api/verify/session-email
router.post('/session-email', async (req, res) => {
  try {
    const { sessionToken, expectedEmails } = req.body;
    if (!sessionToken) return res.json({ success: false, error: 'sessionToken is required' });
    const client = getClient();
    if (!client) return noClient(res);
    const result = await client.validateSession(sessionToken);
    const email = result?.token?.email || result?.token?.sub || '';
    const match = Array.isArray(expectedEmails) && expectedEmails.includes(email);
    return res.json({ success: true, data: { match, email } });
  } catch (err) {
    console.error('[verify/session-email]', err.message);
    return res.json({ success: false, error: err.message || 'Session validation failed' });
  }
});

// POST /api/verify/amr
router.post('/amr', async (req, res) => {
  try {
    const { sessionToken, requiredAmr } = req.body;
    if (!sessionToken || !requiredAmr) return res.json({ success: false, error: 'sessionToken and requiredAmr are required' });
    const client = getClient();
    if (!client) return noClient(res);
    const result = await client.validateSession(sessionToken);
    const amr = result?.token?.amr || [];
    return res.json({ success: true, data: { hasRequired: amr.includes(requiredAmr), amr } });
  } catch (err) {
    console.error('[verify/amr]', err.message);
    return res.json({ success: false, error: err.message });
  }
});

// POST /api/verify/user-exists  — accepts { email } or { actor }
router.post('/user-exists', async (req, res) => {
  try {
    const email = req.body.email || (req.body.actor ? deriveEmail(req.body.actor) : null);
    if (!email) return res.json({ success: false, error: 'email or actor is required' });
    const client = getClient();
    if (!client) return noClient(res);
    const result = await client.management.user.load(email);
    if (!result.ok) {
      return res.json({ success: false, error: 'User not found', data: { exists: false } });
    }
    return res.json({ success: true, data: { exists: true, status: result.data?.status } });
  } catch (err) {
    console.error('[verify/user-exists]', err.message);
    return res.json({ success: false, error: err.message || 'User lookup failed' });
  }
});

// POST /api/verify/user-not-exists — gate passes when user does NOT exist
router.post('/user-not-exists', async (req, res) => {
  try {
    const email = req.body.email || (req.body.actor ? deriveEmail(req.body.actor) : null);
    if (!email) return res.json({ success: false, error: 'email or actor is required' });
    const client = getClient();
    if (!client) return noClient(res);
    const result = await client.management.user.load(email);
    if (!result.ok) {
      return res.json({ success: true, data: { exists: false } });
    }
    return res.json({ success: false, error: 'Account still exists — delete it in Descope first' });
  } catch (err) {
    console.error('[verify/user-not-exists]', err.message);
    return res.json({ success: false, error: err.message || 'User lookup failed' });
  }
});

// POST /api/verify/user-locked — accepts { email } or { actor }
router.post('/user-locked', async (req, res) => {
  try {
    const email = req.body.email || (req.body.actor ? deriveEmail(req.body.actor) : null);
    if (!email) return res.json({ success: false, error: 'email or actor is required' });
    const client = getClient();
    if (!client) return noClient(res);
    const result = await client.management.user.load(email);
    if (!result.ok) {
      return res.json({ success: false, error: 'User not found' });
    }
    const user = result.data || {};
    const status = user.status;
    const locked = status === 'disabled' || !!user.lockedExpiry;
    if (!locked) return res.json({ success: false, error: `Account is not locked (status: ${status})` });
    return res.json({ success: true, data: { locked: true } });
  } catch (err) {
    console.error('[verify/user-locked]', err.message);
    return res.json({ success: false, error: err.message || 'User lookup failed' });
  }
});

// POST /api/verify/flow-exists — flowId from body, falls back to process.env.VITE_FLOW_ID
router.post('/flow-exists', async (req, res) => {
  try {
    const flowId = req.body.flowId || process.env.VITE_FLOW_ID;
    if (!flowId) return res.json({ success: false, error: 'No flow ID — paste a Flow ID in the previous step first.' });
    const client = getClient();
    if (!client) return noClient(res);
    const result = await client.management.flow.export(flowId);
    if (!result.ok) {
      return res.json({ success: false, error: `Flow "${flowId}" not found in your Descope project. Check the Flow ID is correct.` });
    }
    return res.json({ success: true, data: { exists: true, flowId } });
  } catch (err) {
    console.error('[verify/flow-exists]', err.message);
    return res.json({ success: false, error: err.message || 'Flow lookup failed' });
  }
});

// POST /api/verify/stepup-flow
router.post('/stepup-flow', async (req, res) => {
  try {
    const { flowId } = req.body;
    if (!flowId) return res.json({ success: false, error: 'flowId is required' });
    const client = getClient();
    if (!client) return noClient(res);
    const result = await client.management.flow.export(flowId);
    if (!result.ok) {
      return res.json({ success: false, error: `Step-up flow "${flowId}" not found` });
    }
    return res.json({ success: true, data: { exists: true } });
  } catch (err) {
    console.error('[verify/stepup-flow]', err.message);
    return res.json({ success: false, error: err.message || 'Flow lookup failed' });
  }
});

// POST /api/verify/password-policy
router.post('/password-policy', async (req, res) => {
  try {
    const client = getClient();
    if (!client) return noClient(res);
    const result = await client.management.password.getSettings('');
    if (!result.ok) {
      return res.json({ success: false, error: 'Failed to fetch password policy' });
    }
    const policy = result.data || {};
    const missing = [];
    if (!policy.minLength || policy.minLength < 10) missing.push('Minimum length ≥ 10');
    if (!policy.uppercase) missing.push('Uppercase letter required');
    if (!policy.number) missing.push('Number required');
    if (!policy.nonAlphanumeric) missing.push('Special character required');
    if (missing.length > 0) {
      return res.json({ success: false, error: `Policy missing: ${missing.join(', ')}`, data: { missing } });
    }
    return res.json({ success: true, data: { missing: [] } });
  } catch (err) {
    console.error('[verify/password-policy]', err.message);
    return res.json({ success: false, error: err.message || 'Policy check failed' });
  }
});

// POST /api/verify/users-imported — checks Joel, Alex, Vicky exist
router.post('/users-imported', async (req, res) => {
  try {
    const client = getClient();
    if (!client) return noClient(res);
    const actors = ['joel', 'alex', 'vicky'];
    const missing = [];
    for (const actor of actors) {
      const email = deriveEmail(actor);
      if (!email) { missing.push(actor); continue; }
      const result = await client.management.user.load(email);
      if (!result.ok) missing.push(actor);
    }
    if (missing.length > 0) {
      return res.json({ success: false, error: `Missing accounts: ${missing.join(', ')}. Import them in Descope first.` });
    }
    return res.json({ success: true, data: { verified: actors } });
  } catch (err) {
    console.error('[verify/users-imported]', err.message);
    return res.json({ success: false, error: err.message || 'User check failed' });
  }
});

// POST /api/verify/new-users-invited — checks Jane, Bill, Beth exist (legacy alias)
router.post('/new-users-invited', async (req, res) => {
  try {
    const client = getClient();
    if (!client) return noClient(res);
    const actors = ['jane', 'bill', 'beth'];
    const missing = [];
    for (const actor of actors) {
      const email = deriveEmail(actor);
      if (!email) { missing.push(actor); continue; }
      const result = await client.management.user.load(email);
      if (!result.ok) missing.push(actor);
    }
    if (missing.length > 0) {
      return res.json({ success: false, error: `Missing accounts: ${missing.join(', ')}. Import them with invited status.` });
    }
    return res.json({ success: true, data: { verified: actors } });
  } catch (err) {
    console.error('[verify/new-users-invited]', err.message);
    return res.json({ success: false, error: err.message || 'User check failed' });
  }
});

// POST /api/verify/m2-import — confirms Jane, Bill, Beth exist in Descope
router.post('/m2-import', async (req, res) => {
  try {
    const client = getClient();
    if (!client) return noClient(res);
    const actors = ['jane', 'bill', 'beth'];
    const missing = [];
    for (const actor of actors) {
      const email = deriveEmail(actor);
      if (!email) { missing.push(actor); continue; }
      const result = await client.management.user.load(email);
      if (!result.ok) missing.push(actor);
    }
    if (missing.length > 0) {
      return res.json({ success: false, error: `Accounts not found: ${missing.join(', ')}. Import them via Descope Console → User Management → Import (JSON tab).` });
    }
    return res.json({ success: true, data: { verified: actors } });
  } catch (err) {
    console.error('[verify/m2-import]', err.message);
    return res.json({ success: false, error: err.message || 'User check failed' });
  }
});

// POST /api/verify/m1-import — creates Joel, Alex, Vicky via Management API then verifies
router.post('/m1-import', async (req, res) => {
  try {
    const client = getClient();
    if (!client) return noClient(res);
    let legacyUsers;
    try {
      legacyUsers = readLegacyUsers();
    } catch (e) {
      return res.json({ success: false, error: 'Could not read legacy-users.csv — ensure data/legacy-users.csv exists.' });
    }
    if (!legacyUsers.length) {
      return res.json({ success: false, error: 'legacy-users.csv is empty or malformed.' });
    }
    const users = await Promise.all(legacyUsers.map(async ({ actor, displayName, password }) => {
      const email = deriveEmail(actor);
      const hash = await bcrypt.hash(password, 10);
      return {
        loginIdOrUserId: email,
        email,
        displayName,
        verifiedEmail: true,
        status: 'enabled',
        hashedPassword: { bcrypt: { hash } },
      };
    }));
    try {
      await client.management.user.createBatch(users);
    } catch (_) {
      // Batch may throw if some already exist; we verify existence below
    }
    const missing = [];
    for (const { actor } of legacyUsers) {
      const email = deriveEmail(actor);
      if (!email) { missing.push(actor); continue; }
      const result = await client.management.user.load(email);
      if (!result.ok) missing.push(actor);
    }
    if (missing.length > 0) {
      return res.json({ success: false, error: `Import incomplete — not found: ${missing.join(', ')}. Check your Management Key has full user permissions.` });
    }
    return res.json({ success: true, data: { imported: legacyUsers.map(u => u.actor) } });
  } catch (err) {
    console.error('[verify/m1-import]', err.message);
    return res.json({ success: false, error: err.message || 'Import failed' });
  }
});

// POST /api/verify/m5-session — validates live session, confirms email is a new-customer actor
router.post('/m5-session', async (req, res) => {
  try {
    const { sessionToken } = req.body;
    if (!sessionToken) return res.json({ success: false, error: 'No active session detected — sign in as Jane, Bill, or Beth at /login and return to the wizard.' });
    const client = getClient();
    if (!client) return noClient(res);
    const result = await client.validateSession(sessionToken);
    const email = result?.token?.email || result?.token?.sub || '';
    const base = process.env.BASE_EMAIL || '';
    const domain = base.includes('@') ? base.split('@')[1] : '';
    const isNewCustomer = ['jane', 'bill', 'beth'].some(a => email.includes(`+${a}@${domain}`));
    if (!isNewCustomer) {
      return res.json({ success: false, error: `Signed in as ${email || 'unknown'} — expected Jane, Bill, or Beth. Sign out, then sign in as one of the new customers.` });
    }
    return res.json({ success: true, data: { email, verified: true } });
  } catch (err) {
    console.error('[verify/m5-session]', err.message);
    return res.json({ success: false, error: err.message || 'Session validation failed' });
  }
});

// POST /api/verify/passkey-enrolled — checks webAuthn on actor
router.post('/passkey-enrolled', async (req, res) => {
  try {
    const email = req.body.email || (req.body.actor ? deriveEmail(req.body.actor) : null);
    if (!email) return res.json({ success: false, error: 'email or actor is required' });
    const client = getClient();
    if (!client) return noClient(res);
    const result = await client.management.user.load(email);
    if (!result.ok) {
      return res.json({ success: false, error: `User not found: ${req.body.actor || email}` });
    }
    const user = result.data || {};
    const webauthn = user.webauthn;
    const enrolled = webauthn === true || (Array.isArray(webauthn) && webauthn.length > 0);
    if (!enrolled) {
      return res.json({ success: false, error: `No passkey enrolled for ${req.body.actor || email}. Complete the passkey enrollment flow first.` });
    }
    const count = Array.isArray(webauthn) ? webauthn.length : 1;
    return res.json({ success: true, data: { enrolled: true, count } });
  } catch (err) {
    console.error('[verify/passkey-enrolled]', err.message);
    return res.json({ success: false, error: err.message || 'Passkey check failed' });
  }
});

// POST /api/verify/m9-session — validates session from Authorization header, returns decoded claims
router.post('/m9-session', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    if (!token) return res.json({ success: false, error: 'No session token found in Authorization header — make sure you are signed in to the ClearBank app before running this gate.' });
    const client = getClient();
    if (!client) return noClient(res);
    const result = await client.validateSession(token);
    return res.json({ success: true, data: result?.token || result });
  } catch (err) {
    console.error('[verify/m9-session]', err.message);
    return res.json({ success: false, error: err.message || 'Session validation failed' });
  }
});

// POST /api/verify/stepup-flow-exists — reads VITE_STEPUP_FLOW_ID from .env
router.post('/stepup-flow-exists', async (req, res) => {
  try {
    const flowId = process.env.VITE_STEPUP_FLOW_ID;
    if (!flowId) return res.json({ success: false, error: 'No step-up flow ID configured — paste your Step-Up Flow ID in the previous step first.' });
    const client = getClient();
    if (!client) return noClient(res);
    const result = await client.management.flow.export(flowId);
    if (!result.ok) {
      return res.json({ success: false, error: `Step-up flow "${flowId}" not found in your Descope project. Check the Flow ID is correct.` });
    }
    return res.json({ success: true, data: { exists: true, flowId } });
  } catch (err) {
    console.error('[verify/stepup-flow-exists]', err.message);
    return res.json({ success: false, error: err.message || 'Flow lookup failed' });
  }
});

// POST /api/verify/m12-locked — confirms Mike's account is locked after failed attempts
router.post('/m12-locked', async (req, res) => {
  try {
    const client = getClient();
    if (!client) return noClient(res);
    const email = deriveEmail('mike');
    if (!email) return res.json({ success: false, error: 'BASE_EMAIL not configured' });
    const result = await client.management.user.load(email);
    if (!result.ok) {
      return res.json({ success: false, error: "Mike's account not found — check BASE_EMAIL is correct." });
    }
    const user = result.data || {};
    const lockedExpiry = user.lockedExpiry;
    const isLocked = !!lockedExpiry && new Date(lockedExpiry) > new Date();
    if (!isLocked) {
      const hint = lockedExpiry
        ? `Lockout expired at ${lockedExpiry} — trigger 3 more failed attempts.`
        : `No lockout detected (status: ${user.status}). Complete 3 failed login attempts at /login first.`;
      return res.json({ success: false, error: hint });
    }
    return res.json({ success: true, data: { locked: true, lockedExpiry } });
  } catch (err) {
    console.error('[verify/m12-locked]', err.message);
    return res.json({ success: false, error: err.message || 'User lookup failed' });
  }
});

module.exports = router;
