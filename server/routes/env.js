const express = require('express');
const router = express.Router();
const { sanitizedRead, writeKey, writeBatch } = require('../lib/envManager');
const { resetClient } = require('../lib/descopeClient');

// GET /api/env/read
router.get('/read', (req, res) => {
  try {
    const data = sanitizedRead();
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[env/read]', err);
    return res.json({ success: false, error: 'Failed to read .env file' });
  }
});

// POST /api/env/write
router.post('/write', (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) return res.json({ success: false, error: 'key is required' });
    if (value === undefined) return res.json({ success: false, error: 'value is required' });
    writeKey(key, value);
    // Reload into process.env
    process.env[key] = value;
    // Reset Descope client if management key changed
    if (key === 'DESCOPE_MANAGEMENT_KEY' || key === 'VITE_DESCOPE_PROJECT_ID') {
      resetClient();
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('[env/write]', err);
    return res.json({ success: false, error: 'Failed to write .env file' });
  }
});

// POST /api/env/write-batch
router.post('/write-batch', (req, res) => {
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.json({ success: false, error: 'updates array is required' });
    }
    writeBatch(updates);
    for (const { key, value } of updates) {
      process.env[key] = value;
    }
    resetClient();
    return res.json({ success: true });
  } catch (err) {
    console.error('[env/write-batch]', err);
    return res.json({ success: false, error: 'Failed to write .env file' });
  }
});

module.exports = router;
