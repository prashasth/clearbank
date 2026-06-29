const express = require('express');
const router = express.Router();

// POST /api/admin/verify-pin
router.post('/verify-pin', (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) {
      return res.json({ success: false, error: 'PIN is required' });
    }
    const adminPin = process.env.ADMIN_PIN;
    if (!adminPin) {
      return res.json({ success: false, error: 'Admin PIN not configured. Set ADMIN_PIN in .env' });
    }
    if (pin !== adminPin) {
      return res.json({ success: false, error: 'Incorrect PIN' });
    }
    // Return a simple signed token (just a base64 of the pin for session use)
    const token = Buffer.from(`admin:${pin}:${Date.now()}`).toString('base64');
    return res.json({ success: true, token });
  } catch (err) {
    console.error('[admin/verify-pin]', err);
    return res.json({ success: false, error: 'Internal error verifying PIN' });
  }
});

// GET /api/admin/status
router.get('/status', (req, res) => {
  try {
    const isConfigured = !!process.env.ADMIN_PIN;
    return res.json({ success: true, data: { isConfigured } });
  } catch (err) {
    console.error('[admin/status]', err);
    return res.json({ success: false, error: 'Internal error' });
  }
});

module.exports = router;
