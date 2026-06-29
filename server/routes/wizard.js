const express = require('express');
const path = require('path');
const fse = require('fs-extra');
const router = express.Router();
const { readState, completeStep, completeMission, resetState, restoreToMission } = require('../lib/wizardState');
const { seedEmail, resetInbox } = require('../lib/inboxSeeder');
const { readEnv, writeBatch } = require('../lib/envManager');

const DATA_DIR = path.join(__dirname, '../../data');
const LEGACY_USERS_CSV = path.join(DATA_DIR, 'legacy-users.csv');
const DEFAULT_LEGACY_CSV = `actor,displayName,password\njoel,Joel,ClearBank@2024\nalex,Alex,ClearBank@2024\nvicky,Vicky,ClearBank@2024\n`;

function getWizardUrl(req) {
  const origin = req.headers.origin || `http://localhost:${process.env.PORT || 3001}`;
  return `${origin}/admin/wizard`;
}

// GET /api/wizard/state
router.get('/state', async (req, res) => {
  try {
    const state = await readState();
    return res.json({ success: true, data: state });
  } catch (err) {
    console.error('[wizard/state]', err);
    return res.json({ success: false, error: 'Failed to read wizard state' });
  }
});

// POST /api/wizard/complete-step
router.post('/complete-step', async (req, res) => {
  try {
    const { missionId, stepId } = req.body;
    if (!missionId || !stepId) {
      return res.json({ success: false, error: 'missionId and stepId are required' });
    }
    const state = await completeStep(missionId, stepId);
    return res.json({ success: true, data: state });
  } catch (err) {
    console.error('[wizard/complete-step]', err);
    return res.json({ success: false, error: err.message || 'Failed to complete step' });
  }
});

// POST /api/wizard/complete-mission
router.post('/complete-mission', async (req, res) => {
  try {
    const { missionId } = req.body;
    if (!missionId) return res.json({ success: false, error: 'missionId is required' });

    const state = await completeMission(missionId);
    const env = readEnv();
    const baseEmail = env.BASE_EMAIL || '';
    const wizardUrl = getWizardUrl(req);

    // Seed completion email for missions that have one
    const completionKey = `${missionId}-complete`;
    try {
      await seedEmail(completionKey, baseEmail, wizardUrl);
    } catch (_) {
      // Not all missions have completion emails — that's fine
    }

    // Seed trigger email for the next mission(s)
    const missionOrder = ['M0','M1','M2','M3','M4','M5','M6','M7','M8','M9','M10','M11','M12'];
    const idx = missionOrder.indexOf(missionId);
    const nextMissions = missionId === 'M10' ? ['M11', 'M12'] : (idx >= 0 && idx < missionOrder.length - 1 ? [missionOrder[idx + 1]] : []);

    for (const nextId of nextMissions) {
      try {
        await seedEmail(`${nextId}-trigger`, baseEmail, wizardUrl);
      } catch (_) {}
    }

    return res.json({ success: true, data: state });
  } catch (err) {
    console.error('[wizard/complete-mission]', err);
    return res.json({ success: false, error: err.message || 'Failed to complete mission' });
  }
});

// POST /api/wizard/restore-to
// Restores wizard to a target mission level, writes env vars, re-seeds all emails
router.post('/restore-to', async (req, res) => {
  try {
    const { pin, missionId, envVars } = req.body;
    if (!pin) return res.json({ success: false, error: 'PIN is required' });
    if (pin !== process.env.ADMIN_PIN) return res.json({ success: false, error: 'Incorrect PIN' });
    if (!missionId) return res.json({ success: false, error: 'missionId is required' });

    const missionOrder = ['M0','M1','M2','M3','M4','M5','M6','M7','M8','M9','M10','M11','M12'];
    const targetIdx = missionOrder.indexOf(missionId);
    if (targetIdx === -1) return res.json({ success: false, error: 'Unknown mission' });

    // Write env vars
    if (envVars && typeof envVars === 'object') {
      const pairs = Object.entries(envVars).filter(([, v]) => v && v.trim());
      if (pairs.length > 0) {
        writeBatch(pairs.map(([key, value]) => ({ key, value: value.trim() })));
        // Sync to process.env
        for (const [key, value] of pairs) process.env[key] = value.trim();
      }
    }

    // If jumping to M2 or beyond, ensure legacy-users.csv exists (created by M1 upload step)
    if (targetIdx >= 2) {
      await fse.ensureDir(DATA_DIR);
      if (!await fse.pathExists(LEGACY_USERS_CSV)) {
        await fse.writeFile(LEGACY_USERS_CSV, DEFAULT_LEGACY_CSV, 'utf8');
      }
    }

    // Restore wizard state
    const state = await restoreToMission(missionId);

    // Clear inbox and re-seed all appropriate emails
    await resetInbox();
    const env = readEnv();
    const baseEmail = env.BASE_EMAIL || '';
    const wizardUrl = getWizardUrl(req);

    // Seed trigger + complete for all missions before target
    for (let i = 1; i < targetIdx; i++) {
      const id = missionOrder[i];
      try { await seedEmail(`${id}-trigger`, baseEmail, wizardUrl); } catch (_) {}
      try { await seedEmail(`${id}-complete`, baseEmail, wizardUrl); } catch (_) {}
    }
    // Seed trigger for target mission (M0 has no trigger)
    if (targetIdx > 0) {
      try { await seedEmail(`${missionId}-trigger`, baseEmail, wizardUrl); } catch (_) {}
    }
    // If target is M11 or M12, seed M10-complete and both triggers since both unlock together
    if (missionId === 'M11' || missionId === 'M12') {
      try { await seedEmail('M10-complete', baseEmail, wizardUrl); } catch (_) {}
      try { await seedEmail('M11-trigger', baseEmail, wizardUrl); } catch (_) {}
      try { await seedEmail('M12-trigger', baseEmail, wizardUrl); } catch (_) {}
    }

    return res.json({ success: true, data: state });
  } catch (err) {
    console.error('[wizard/restore-to]', err);
    return res.json({ success: false, error: err.message || 'Restore failed' });
  }
});

// POST /api/wizard/reset
router.post('/reset', async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) return res.json({ success: false, error: 'PIN is required' });
    if (pin !== process.env.ADMIN_PIN) {
      return res.json({ success: false, error: 'Incorrect PIN' });
    }
    await resetState();
    await resetInbox();
    return res.json({ success: true });
  } catch (err) {
    console.error('[wizard/reset]', err);
    return res.json({ success: false, error: 'Failed to reset training data' });
  }
});

module.exports = router;
