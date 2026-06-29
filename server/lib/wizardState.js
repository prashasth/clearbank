const fse = require('fs-extra');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const WIZARD_PATH = path.join(DATA_DIR, 'wizard.json');

const DEFAULT_STATE = {
  missions: {
    M0: { status: 'active', steps: { step1: false, step2: false, step3: false, step4: false } },
    M1: { status: 'locked', steps: { step1: false, step2: false, step3: false, step4: false } },
    M2: { status: 'locked', steps: { step1: false, step2: false, step3: false, step4: false } },
    M3: { status: 'locked', steps: { step1: false, step2: false, step3: false, step4: false, step5: false, step6: false } },
    M4: { status: 'locked', steps: { step1: false, step2: false, step3: false, step4: false, step5: false, step6: false, step7: false, step8: false } },
    M5: { status: 'locked', steps: { step1: false, step2: false, step3: false, step4: false, step5: false, step6: false, step7: false, step8: false } },
    M6: { status: 'locked', steps: { step1: false, step2: false, step3: false, step4: false, step5: false, step6: false, step7: false, step8: false, step9: false, step10: false } },
    M7: { status: 'locked', steps: { step1: false, step2: false, step3: false, step4: false, step5: false, step6: false, step7: false, step8: false } },
    M8: { status: 'locked', steps: { step1: false, step2: false, step3: false, step4: false, step5: false, step6: false, step7: false, step8: false } },
    M9: { status: 'locked', steps: { step0: false, step1: false, step2: false, step3: false, step4: false, step5: false, step6: false, step7: false, step8: false } },
    M10: { status: 'locked', steps: { step1: false, step2: false, step3: false, step4: false, step5: false, step6: false, step7: false, step8: false, step9: false } },
    M11: { status: 'locked', steps: { step1: false, step2: false, step3: false, step4: false, step5: false, step6: false, step7: false } },
    M12: { status: 'locked', steps: { step1: false, step2: false, step3: false, step4: false, step5: false, step6: false } },
  }
};

async function ensureDataDir() {
  await fse.ensureDir(DATA_DIR);
}

async function readState() {
  await ensureDataDir();
  if (!await fse.pathExists(WIZARD_PATH)) {
    await fse.writeJson(WIZARD_PATH, DEFAULT_STATE, { spaces: 2 });
    return DEFAULT_STATE;
  }
  return fse.readJson(WIZARD_PATH);
}

async function writeState(state) {
  await ensureDataDir();
  await fse.writeJson(WIZARD_PATH, state, { spaces: 2 });
}

async function completeStep(missionId, stepId) {
  const state = await readState();
  const mission = state.missions[missionId];
  if (!mission) throw new Error(`Unknown mission: ${missionId}`);
  if (mission.status === 'locked') throw new Error('Mission is locked');

  const stepKeys = Object.keys(mission.steps);
  const stepIdx = stepKeys.indexOf(stepId);
  if (stepIdx === -1) throw new Error(`Unknown step: ${stepId}`);

  // Enforce sequential unlock
  for (let i = 0; i < stepIdx; i++) {
    if (!mission.steps[stepKeys[i]]) {
      throw new Error('Previous step not complete');
    }
  }

  mission.steps[stepId] = true;
  await writeState(state);
  return state;
}

async function completeMission(missionId) {
  const state = await readState();
  const mission = state.missions[missionId];
  if (!mission) throw new Error(`Unknown mission: ${missionId}`);

  // Mark all steps complete
  for (const key of Object.keys(mission.steps)) {
    mission.steps[key] = true;
  }
  mission.status = 'complete';

  // Unlock next mission(s)
  const missionIds = Object.keys(state.missions);
  const idx = missionIds.indexOf(missionId);

  if (missionId === 'M10') {
    // M11 and M12 unlock together after M10
    if (state.missions['M11']) state.missions['M11'].status = 'active';
    if (state.missions['M12']) state.missions['M12'].status = 'active';
  } else if (idx >= 0 && idx < missionIds.length - 1) {
    const nextId = missionIds[idx + 1];
    if (state.missions[nextId] && state.missions[nextId].status === 'locked') {
      state.missions[nextId].status = 'active';
    }
  }

  await writeState(state);
  return state;
}

async function resetState() {
  await ensureDataDir();
  const freshState = JSON.parse(JSON.stringify(DEFAULT_STATE));
  await fse.writeJson(WIZARD_PATH, freshState, { spaces: 2 });
  return freshState;
}

async function restoreToMission(targetId) {
  const missionOrder = Object.keys(DEFAULT_STATE.missions);
  const targetIdx = missionOrder.indexOf(targetId);
  if (targetIdx === -1) throw new Error(`Unknown mission: ${targetId}`);

  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));

  for (let i = 0; i < missionOrder.length; i++) {
    const id = missionOrder[i];
    const mission = state.missions[id];
    if (i < targetIdx) {
      for (const k of Object.keys(mission.steps)) mission.steps[k] = true;
      mission.status = 'complete';
    } else if (id === targetId) {
      mission.status = 'active';
    } else {
      mission.status = 'locked';
    }
  }

  // M11 and M12 both unlock together after M10 — if targeting either, activate both
  if (targetId === 'M11' || targetId === 'M12') {
    state.missions['M11'].status = 'active';
    state.missions['M12'].status = 'active';
  }

  await writeState(state);
  return state;
}

module.exports = { readState, writeState, completeStep, completeMission, resetState, restoreToMission };
