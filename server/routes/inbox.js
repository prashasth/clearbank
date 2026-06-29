const express = require('express');
const router = express.Router();
const { readInbox, getUnreadCount, markRead, markAllRead } = require('../lib/inboxSeeder');

// GET /api/inbox/all
router.get('/all', async (req, res) => {
  try {
    const inbox = await readInbox();
    // Newest first
    const sorted = [...inbox].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return res.json({ success: true, data: sorted });
  } catch (err) {
    console.error('[inbox/all]', err);
    return res.json({ success: false, error: 'Failed to read inbox' });
  }
});

// GET /api/inbox/unread-count
router.get('/unread-count', async (req, res) => {
  try {
    const count = await getUnreadCount();
    return res.json({ success: true, data: { count } });
  } catch (err) {
    console.error('[inbox/unread-count]', err);
    return res.json({ success: false, error: 'Failed to get unread count' });
  }
});

// POST /api/inbox/mark-read
router.post('/mark-read', async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.json({ success: false, error: 'id is required' });
    await markRead(id);
    return res.json({ success: true });
  } catch (err) {
    console.error('[inbox/mark-read]', err);
    return res.json({ success: false, error: 'Failed to mark email as read' });
  }
});

// POST /api/inbox/mark-all-read
router.post('/mark-all-read', async (req, res) => {
  try {
    await markAllRead();
    return res.json({ success: true });
  } catch (err) {
    console.error('[inbox/mark-all-read]', err);
    return res.json({ success: false, error: 'Failed to mark all as read' });
  }
});

module.exports = router;
