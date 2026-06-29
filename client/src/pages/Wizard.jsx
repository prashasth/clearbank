import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import PinGate from '../components/PinGate.jsx';
import NotificationBell from '../components/NotificationBell.jsx';
import { MISSIONS, MISSION_ORDER } from './missionDefs.js';
import { useAuth } from '../context/AuthContext.jsx';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusIcon(status) {
  if (status === 'complete') return '✅';
  if (status === 'active') return '🔵';
  return '🔒';
}

function allStepsDone(mission) {
  return Object.values(mission.steps).every(Boolean);
}

function firstIncomplete(mission) {
  return Object.entries(mission.steps).find(([, done]) => !done)?.[0];
}

// ─── Step Components ──────────────────────────────────────────────────────────

function TrustStep({ step, onComplete, isLoading }) {
  return (
    <div style={S.stepAction}>
      <button onClick={() => onComplete()} disabled={isLoading} style={S.doneBtn}>
        ✓ {step.buttonLabel || 'Done'}
      </button>
    </div>
  );
}

function RestartStep({ step, onComplete }) {
  return (
    <div style={S.stepAction}>
      <div style={S.restartNote}>
        ⚠️ Stop the Vite client (<code>Ctrl+C</code> in terminal 2), then run <code>npm run dev</code> again before clicking below.
      </div>
      <button onClick={() => onComplete()} style={S.doneBtn}>
        ✓ {step.buttonLabel || "I've Restarted"}
      </button>
    </div>
  );
}

function UploadStep({ step, onComplete, isLoading }) {
  const [status, setStatus] = useState('idle'); // idle | uploading | preview | error
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('uploading');
    setError(null);
    try {
      const form = new FormData();
      form.append('csv', file);
      const { data } = await axios.post('/api/verify/m1-upload', form);
      if (data.success) {
        setPreview(data.data.users);
        setStatus('preview');
      } else {
        setError(data.error || 'Upload failed');
        setStatus('error');
      }
    } catch (_) {
      setError('Connection error — check your terminal is still running.');
      setStatus('error');
    }
  };

  return (
    <div style={S.stepAction}>
      {status === 'idle' || status === 'error' ? (
        <label style={S.uploadLabel}>
          <input type="file" accept=".csv" onChange={handleFile} style={{ display: 'none' }} />
          <span style={S.uploadBtn}>📂 Upload CSV</span>
        </label>
      ) : null}
      {status === 'uploading' && <p style={{ fontSize: 14, color: '#64748b' }}>Parsing and hashing passwords…</p>}
      {error && <p style={S.errorText}>❌ {error}</p>}
      {status === 'preview' && preview && (
        <>
          <div style={S.previewTable}>
            <div style={S.previewHeader}>
              <span style={S.previewCell}>Actor</span>
              <span style={S.previewCell}>Email</span>
              <span style={{ ...S.previewCell, flex: 2 }}>Bcrypt Hash</span>
            </div>
            {preview.map(u => (
              <div key={u.actor} style={S.previewRow}>
                <span style={S.previewCell}>{u.displayName}</span>
                <span style={S.previewCell}>{u.email}</span>
                <span style={{ ...S.previewCell, flex: 2, fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all', color: '#64748b' }}>{u.hash}</span>
              </div>
            ))}
          </div>
          <button onClick={() => onComplete()} disabled={isLoading} style={S.doneBtn}>
            ✓ {step.buttonLabel || 'Confirmed'}
          </button>
        </>
      )}
    </div>
  );
}

function SnippetStep({ step, onComplete, isLoading, envValues }) {
  const [copied, setCopied] = useState(false);
  const content = typeof step.getSnippet === 'function' ? step.getSnippet(envValues) : (step.snippet || '');
  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  const handleDownload = () => {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = step.downloadName || 'snippet.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div style={S.stepAction}>
      <div style={S.snippetBox}>
        <pre style={S.snippetPre}>{content}</pre>
        <div style={S.snippetBtns}>
          <button onClick={handleCopy} style={S.copyBtn}>{copied ? '✓ Copied' : 'Copy'}</button>
          {step.downloadName && (
            <button onClick={handleDownload} style={S.downloadBtn}>⬇ Download</button>
          )}
        </div>
      </div>
      <button onClick={() => onComplete()} disabled={isLoading} style={S.doneBtn}>
        ✓ {step.buttonLabel || 'Done'}
      </button>
    </div>
  );
}

function InputStep({ step, uiState, setUi, onComplete, sessionToken, setSessionToken }) {
  const handleSave = async () => {
    const value = uiState.inputValue?.trim();
    if (!value) return;
    setUi({ loading: true, error: null });

    // Session token — store in component state, don't write to .env
    if (step.isSessionToken) {
      setSessionToken(value);
      setUi({ loading: false, error: null, inputValue: value });
      await onComplete();
      return;
    }

    try {
      const { data } = await axios.post('/api/env/write', { key: step.envKey, value });
      if (data.success) {
        setUi({ loading: false, error: null });
        await onComplete();
      } else {
        setUi({ loading: false, error: data.error || 'Failed to save' });
      }
    } catch (_) {
      setUi({ loading: false, error: 'Connection error — check your terminal is still running and retry.' });
    }
  };

  return (
    <div style={S.stepAction}>
      <label style={S.inputLabel}>{step.label || step.envKey}</label>
      <div style={S.inputRow}>
        <input
          type={step.secret ? 'password' : 'text'}
          value={uiState.inputValue || ''}
          onChange={e => setUi({ inputValue: e.target.value })}
          placeholder={step.placeholder || ''}
          style={S.textInput}
          autoComplete="off"
        />
        <button
          onClick={handleSave}
          disabled={!uiState.inputValue?.trim() || uiState.loading}
          style={S.saveBtn}
        >
          {uiState.loading ? 'Saving…' : 'Save & Continue'}
        </button>
      </div>
      {uiState.error && <p style={S.errorText}>❌ {uiState.error}</p>}
    </div>
  );
}

function GateStep({ step, uiState, setUi, onComplete, envValues, sessionToken, authToken, isUnlocked }) {
  const hasAutoRun = useRef(false);

  const runVerify = useCallback(async (maxAttempts = 3) => {
    setUi({ loading: true, error: null });
    const ctx = { envValues, sessionToken, authToken };
    const body = step.getBody ? step.getBody(ctx) : {};

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const { data } = await axios.post(step.endpoint, body);
        // For expectFailure gates (M9 step7), success means the backend returned failure
        const passed = step.expectFailure ? !data.success : data.success;
        if (passed) {
          setUi({ loading: false, error: null, claims: data.data });
          await onComplete(false);
          return;
        }
        // Last auto-retry exhausted — surface error
        if (i === maxAttempts - 1) {
          const errMsg = step.expectFailure
            ? 'Session is still active — revoke it in Descope first, then retry.'
            : (data.error || 'Verification failed');
          setUi({ loading: false, error: errMsg });
        } else {
          await delay(1500);
        }
      } catch (_) {
        if (i === maxAttempts - 1) {
          setUi({ loading: false, error: 'Connection error — check your terminal is still running and retry.' });
        } else {
          await delay(1500);
        }
      }
    }
  }, [step, envValues, sessionToken, authToken]);

  useEffect(() => {
    if (isUnlocked && !hasAutoRun.current) {
      hasAutoRun.current = true;
      runVerify(3);
    }
  }, [isUnlocked]);

  const handleRetry = async () => {
    const newCount = (uiState.retryCount || 0) + 1;
    setUi({ retryCount: newCount });
    await runVerify(1);
  };

  const handleProceedAnyway = async () => {
    await onComplete(true);
  };

  if (uiState.loading) {
    return (
      <div style={S.gateLoading}>
        <div style={S.gateSpinner} />
        <span>Verifying…</span>
      </div>
    );
  }

  if (uiState.error) {
    return (
      <div style={S.stepAction}>
        <div style={S.errorBox}>
          <p style={S.errorText}>❌ {uiState.error}</p>
        </div>
        <div style={S.retryRow}>
          <button onClick={handleRetry} style={S.retryBtn}>↻ Retry</button>
          {(uiState.retryCount || 0) >= 3 && (
            <button onClick={handleProceedAnyway} style={S.proceedBtn}>
              Proceed Anyway ⚠️
            </button>
          )}
        </div>
        {(uiState.retryCount || 0) >= 3 && (
          <div style={S.warningBanner}>
            ⚠️ Skipping verification. This step may need to be revisited. The step will be marked with a warning icon.
          </div>
        )}
        {(uiState.retryCount || 0) > 0 && (uiState.retryCount || 0) < 3 && (
          <p style={S.retryHint}>Retry {uiState.retryCount}/3 — "Proceed Anyway" unlocks after 3 retries.</p>
        )}
      </div>
    );
  }

  return null; // Loading or done — done is handled by parent
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── Single Step Row ──────────────────────────────────────────────────────────

function StepRow({ step, stepDef, wizardDone, warning, isUnlocked, isActive, missionId, onStepComplete, envValues, sessionToken, setSessionToken, authToken }) {
  const [uiState, setUiStateRaw] = useState({ loading: false, error: null, inputValue: '', retryCount: 0, claims: null });
  const setUi = (patch) => setUiStateRaw(prev => ({ ...prev, ...patch }));

  const handleComplete = async (isWarning = false) => {
    setUi({ loading: true });
    try {
      const { data } = await axios.post('/api/wizard/complete-step', { missionId, stepId: step.id });
      if (data.success) {
        onStepComplete(data.data, isWarning, step.id);
      } else {
        setUi({ loading: false, error: data.error || 'Failed to complete step' });
      }
    } catch (_) {
      setUi({ loading: false, error: 'Connection error — check your terminal is still running and retry.' });
    }
  };

  const stepNum = stepDef ? stepDef.steps.findIndex(s => s.id === step.id) + 1 : '?';

  if (wizardDone) {
    return (
      <div style={{ ...S.stepRow, ...S.stepRowDone }}>
        <div style={S.stepNumDone}>{warning ? '⚠️' : '✅'}</div>
        <div style={S.stepContent}>
          <p style={S.stepTitle}>{step.title}</p>
          <p style={S.stepDoneLabel}>{warning ? 'Proceeded with warning' : 'Complete'}</p>
        </div>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div style={{ ...S.stepRow, opacity: 0.4 }}>
        <div style={S.stepNum}>{stepNum}</div>
        <div style={S.stepContent}>
          <p style={S.stepTitle}>{step.title}</p>
          <p style={{ ...S.stepDesc, color: '#94a3b8' }}>🔒 Complete previous step to unlock</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...S.stepRow, ...(isActive ? S.stepRowActive : {}) }}>
      <div style={{ ...S.stepNum, ...(isActive ? S.stepNumActive : {}) }}>{stepNum}</div>
      <div style={S.stepContent}>
        <p style={S.stepTitle}>{step.title}</p>
        <p style={S.stepDesc}>{step.description}</p>

        {uiState.error && step.type !== 'gate' && (
          <p style={S.errorText}>❌ {uiState.error}</p>
        )}

        {step.type === 'trust' && (
          <TrustStep step={step} onComplete={handleComplete} isLoading={uiState.loading} />
        )}
        {step.type === 'upload' && (
          <UploadStep step={step} onComplete={handleComplete} isLoading={uiState.loading} />
        )}
        {step.type === 'snippet' && (
          <SnippetStep step={step} onComplete={handleComplete} isLoading={uiState.loading} envValues={envValues} />
        )}
        {step.type === 'restart' && (
          <RestartStep step={step} onComplete={handleComplete} />
        )}
        {step.type === 'input' && (
          <InputStep
            step={step}
            uiState={uiState}
            setUi={setUi}
            onComplete={handleComplete}
            sessionToken={sessionToken}
            setSessionToken={setSessionToken}
          />
        )}
        {step.type === 'gate' && (
          <GateStep
            step={step}
            uiState={uiState}
            setUi={setUi}
            onComplete={handleComplete}
            envValues={envValues}
            sessionToken={sessionToken}
            authToken={authToken}
            isUnlocked={isUnlocked}
          />
        )}

        {step.type === 'gate' && uiState.claims && (
          <div style={S.claimsBox}>
            <p style={S.claimsTitle}>Session Claims</p>
            {Object.entries(uiState.claims).slice(0, 8).map(([k, v]) => (
              <div key={k} style={S.claimRow}>
                <span style={S.claimKey}>{k}</span>
                <span style={S.claimVal}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Jump-to-Mission Modal ────────────────────────────────────────────────────

const JUMP_FIELDS = {
  M0:  [],
  M1:  [],
  M2:  [{ key: 'DESCOPE_MANAGEMENT_KEY', label: 'Management Key', placeholder: 'K2...' }],
  M3:  [{ key: 'DESCOPE_MANAGEMENT_KEY', label: 'Management Key', placeholder: 'K2...' }],
  M4:  [{ key: 'DESCOPE_MANAGEMENT_KEY', label: 'Management Key', placeholder: 'K2...' }],
  M5:  [{ key: 'DESCOPE_MANAGEMENT_KEY', label: 'Management Key', placeholder: 'K2...' }],
  M6:  [{ key: 'DESCOPE_MANAGEMENT_KEY', label: 'Management Key', placeholder: 'K2...' }],
  M7:  [{ key: 'DESCOPE_MANAGEMENT_KEY', label: 'Management Key', placeholder: 'K2...' }],
  M8:  [{ key: 'DESCOPE_MANAGEMENT_KEY', label: 'Management Key', placeholder: 'K2...' }],
  M9:  [{ key: 'DESCOPE_MANAGEMENT_KEY', label: 'Management Key', placeholder: 'K2...' }],
  M10: [
    { key: 'DESCOPE_MANAGEMENT_KEY', label: 'Management Key', placeholder: 'K2...' },
    { key: 'VITE_FLOW_ID', label: 'Unified Flow ID (set in M7, restored in M9)', placeholder: 'flw...' },
  ],
  M11: [
    { key: 'DESCOPE_MANAGEMENT_KEY', label: 'Management Key', placeholder: 'K2...' },
    { key: 'VITE_FLOW_ID', label: 'Unified Flow ID (from M7)', placeholder: 'flw...' },
    { key: 'VITE_STEPUP_FLOW_ID', label: 'Step-Up Flow ID (from M10)', placeholder: 'flw...' },
  ],
  M12: [
    { key: 'DESCOPE_MANAGEMENT_KEY', label: 'Management Key', placeholder: 'K2...' },
    { key: 'VITE_FLOW_ID', label: 'Unified Flow ID (from M7)', placeholder: 'flw...' },
    { key: 'VITE_STEPUP_FLOW_ID', label: 'Step-Up Flow ID (from M10)', placeholder: 'flw...' },
  ],
};

function JumpToMissionModal({ onClose, onSuccess }) {
  const [step, setStep] = useState('pick'); // 'pick' | 'fill'
  const [targetId, setTargetId] = useState(null);
  const [pin, setPin] = useState('');
  const [fields, setFields] = useState({}); // key → value
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectMission = (id) => {
    setTargetId(id);
    // Pre-init field values to empty strings
    const initFields = {};
    for (const f of [
      { key: 'BASE_EMAIL' }, { key: 'VITE_DESCOPE_PROJECT_ID' },
      ...(JUMP_FIELDS[id] || [])
    ]) initFields[f.key] = '';
    setFields(initFields);
    setStep('fill');
  };

  const handleSubmit = async () => {
    setError('');
    if (!pin.trim()) { setError('Admin PIN is required'); return; }
    if (!fields.BASE_EMAIL?.trim()) { setError('Base Email is required'); return; }
    if (!fields.VITE_DESCOPE_PROJECT_ID?.trim()) { setError('Descope Project ID is required'); return; }
    setSubmitting(true);
    try {
      const { data } = await axios.post('/api/wizard/restore-to', {
        pin,
        missionId: targetId,
        envVars: fields,
      });
      if (data.success) {
        onSuccess(data.data, targetId);
      } else {
        setError(data.error || 'Restore failed');
      }
    } catch (_) {
      setError('Connection error — check your terminal.');
    }
    setSubmitting(false);
  };

  const extraFields = JUMP_FIELDS[targetId] || [];
  const allFields = [
    { key: 'BASE_EMAIL', label: 'Base Email', placeholder: 'you@gmail.com' },
    { key: 'VITE_DESCOPE_PROJECT_ID', label: 'Descope Project ID', placeholder: 'P2abc...' },
    ...extraFields,
  ];

  return (
    <div style={SM.overlay} onClick={onClose}>
      <div style={SM.modal} onClick={e => e.stopPropagation()}>
        <div style={SM.header}>
          <span style={SM.title}>Jump to Mission</span>
          <button style={SM.closeBtn} onClick={onClose}>✕</button>
        </div>

        {step === 'pick' && (
          <>
            <p style={SM.subtitle}>Select the mission level to restore to. All previous missions will be marked complete.</p>
            <div style={SM.grid}>
              {MISSION_ORDER.map(id => (
                <button key={id} style={SM.missionBtn} onClick={() => selectMission(id)}>
                  <span style={SM.missionBtnId}>{id}</span>
                  <span style={SM.missionBtnTitle}>{MISSIONS[id]?.title}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 'fill' && (
          <>
            <div style={SM.targetBadge}>
              Restoring to <strong>{targetId}</strong> — {MISSIONS[targetId]?.title}
            </div>
            <p style={SM.subtitle}>Enter the credentials needed for this level. These will be written to your <code>.env</code>.</p>

            {allFields.map(f => (
              <div key={f.key} style={SM.fieldGroup}>
                <label style={SM.fieldLabel}>{f.label}</label>
                <input
                  style={SM.fieldInput}
                  type={f.key === 'DESCOPE_MANAGEMENT_KEY' ? 'password' : 'text'}
                  placeholder={f.placeholder}
                  value={fields[f.key] || ''}
                  onChange={e => setFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                />
              </div>
            ))}

            <div style={SM.fieldGroup}>
              <label style={SM.fieldLabel}>Admin PIN</label>
              <input
                style={SM.fieldInput}
                type="password"
                placeholder="Enter admin PIN to confirm"
                value={pin}
                onChange={e => setPin(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            {error && <p style={SM.error}>{error}</p>}

            <div style={SM.actions}>
              <button style={SM.backBtn} onClick={() => { setStep('pick'); setError(''); }}>← Back</button>
              <button style={SM.submitBtn} onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Restoring…' : `Restore to ${targetId}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Wizard Content ───────────────────────────────────────────────────────────

function WizardContent() {
  const { sessionToken: authToken, logout, user } = useAuth();
  const navigate = useNavigate();
  const [wizardState, setWizardState] = useState(null);
  const [envValues, setEnvValues] = useState({});
  const [activeMission, setActiveMission] = useState(null);
  const [expanded, setExpanded] = useState({}); // completed missions expanded
  const [sessionToken, setSessionToken] = useState(''); // M9 captured token
  const [warnings, setWarnings] = useState({}); // stepId -> true
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [resetPin, setResetPin] = useState('');
  const [resetStatus, setResetStatus] = useState('');
  const [completing, setCompleting] = useState(false);
  const [showJump, setShowJump] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [stateRes, envRes] = await Promise.all([
        axios.get('/api/wizard/state'),
        axios.get('/api/env/read'),
      ]);
      if (stateRes.data.success) {
        const s = stateRes.data.data;
        setWizardState(s);
        // Auto-select active mission
        const active = MISSION_ORDER.find(id => s.missions[id]?.status === 'active');
        if (active) setActiveMission(active);
      } else {
        setLoadError(stateRes.data.error || 'Failed to load wizard state');
      }
      if (envRes.data.success) setEnvValues(envRes.data.data);
    } catch (_) {
      setLoadError('Connection error — check your terminal is still running and retry.');
    }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const handleStepComplete = (newState, isWarning, stepId) => {
    setWizardState(newState);
    if (isWarning) setWarnings(prev => ({ ...prev, [stepId]: true }));
    // Refresh env after possible .env write
    axios.get('/api/env/read').then(r => { if (r.data.success) setEnvValues(r.data.data); });
  };

  const handleCompleteMission = async (missionId) => {
    setCompleting(true);
    try {
      const { data } = await axios.post('/api/wizard/complete-mission', { missionId });
      if (data.success) {
        setWizardState(data.data);
        // Auto-advance to next active mission
        const next = MISSION_ORDER.find(id => data.data.missions[id]?.status === 'active' && id !== missionId);
        if (next) setActiveMission(next);
      }
    } catch (_) {}
    setCompleting(false);
  };

  const handleReset = async () => {
    if (!resetPin) return;
    if (!window.confirm('This wipes all mission progress and inbox data. Are you sure?')) return;
    try {
      const { data } = await axios.post('/api/wizard/reset', { pin: resetPin });
      if (data.success) {
        sessionStorage.removeItem('clearbank_admin_token');
        await logout();
        navigate('/');
      } else {
        setResetStatus(data.error || 'Reset failed');
      }
    } catch (_) {
      setResetStatus('Connection error during reset.');
    }
    setResetPin('');
  };

  const handleJumpSuccess = (newState, targetId) => {
    setWizardState(newState);
    setActiveMission(targetId);
    setExpanded({});
    setShowJump(false);
    // Refresh env values
    axios.get('/api/env/read').then(r => { if (r.data.success) setEnvValues(r.data.data); });
  };

  if (loading) return <div style={S.fullCenter}>Loading wizard…</div>;
  if (loadError) return <div style={{ ...S.fullCenter, color: '#dc2626' }}>{loadError} <button onClick={loadAll} style={S.retryBtn}>Retry</button></div>;
  if (!wizardState) return null;

  const missions = wizardState.missions;
  const selectedDef = activeMission ? MISSIONS[activeMission] : null;
  const selectedMission = activeMission ? missions[activeMission] : null;

  const canCompleteMission = selectedMission?.status === 'active' && allStepsDone(selectedMission);

  const firstName = user?.name?.split(' ')[0] || 'Admin';

  return (
    <div style={S.shell}>
      {showJump && <JumpToMissionModal onClose={() => setShowJump(false)} onSuccess={handleJumpSuccess} />}
      {/* ── Top Navbar ── */}
      <nav style={S.nav}>
        <div style={S.navLeft}>
          <div style={S.navLogo}>CB</div>
          <span style={S.navBrand}>ClearBank</span>
          <span style={S.navSep}>|</span>
          <span style={S.navSection}>Mission Wizard</span>
        </div>
        <div style={S.navRight}>
          <NotificationBell />
          <div style={S.userChip}>
            <div style={S.avatar}>{firstName[0].toUpperCase()}</div>
            <span style={S.navUserName}>{firstName}</span>
          </div>
          <button onClick={async () => { await logout(); navigate('/login'); }} style={S.signOutBtn}>Sign Out</button>
        </div>
      </nav>

      {/* ── Body (sidebar + main) ── */}
      <div style={S.layout}>
      {/* ── Sidebar ── */}
      <div style={S.sidebar}>

        <div style={S.missionList}>
          {MISSION_ORDER.map(id => {
            const mission = missions[id];
            const def = MISSIONS[id];
            if (!mission || !def) return null;
            const isActive = activeMission === id;
            const isComplete = mission.status === 'complete';
            const isLocked = mission.status === 'locked';
            const isExpanded = expanded[id];

            return (
              <div key={id}>
                <div
                  onClick={() => {
                    if (isLocked) return;
                    if (isComplete) setExpanded(e => ({ ...e, [id]: !e[id] }));
                    else setActiveMission(id);
                  }}
                  style={{
                    ...S.missionRow,
                    background: isActive ? '#eff6ff' : 'transparent',
                    borderLeft: isActive ? '3px solid #0099cc' : '3px solid transparent',
                    opacity: isLocked ? 0.45 : 1,
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                  }}
                >
                  <span style={S.missionIcon}>{statusIcon(mission.status)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={S.missionId}>{id}</p>
                    <p style={{ ...S.missionTitle, color: isComplete ? '#94a3b8' : '#1e293b' }}>{def.title}</p>
                  </div>
                  {isComplete && <span style={S.expandChevron}>{isExpanded ? '▲' : '▼'}</span>}
                </div>

                {/* Expanded read-only summary for completed missions */}
                {isComplete && isExpanded && def.steps && (
                  <div style={S.expandedSummary}>
                    {def.steps.map(step => (
                      <div key={step.id} style={S.summaryRow}>
                        <span>{warnings[step.id] ? '⚠️' : '✅'}</span>
                        <span style={S.summaryTitle}>{step.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Trainer Reset */}
        <div style={S.resetSection}>
          <p style={S.resetLabel}>TRAINER RESET</p>
          <div style={S.resetRow}>
            <input
              type="password"
              placeholder="Admin PIN"
              value={resetPin}
              onChange={e => setResetPin(e.target.value)}
              style={S.resetInput}
            />
            <button onClick={handleReset} style={S.resetBtn}>Reset</button>
          </div>
          {resetStatus && <p style={S.resetStatus}>{resetStatus}</p>}
          <button onClick={() => setShowJump(true)} style={S.jumpBtn}>
            ⚡ Jump to Mission
          </button>
        </div>
      </div>

      {/* ── Main Panel ── */}
      <div style={S.main}>
        {!activeMission && (
          <div style={S.fullCenter}>
            <p style={{ color: '#94a3b8' }}>Select a mission from the sidebar to begin.</p>
          </div>
        )}

        {activeMission && selectedDef && selectedMission && (
          <div>
            {/* Mission Header */}
            <div style={S.missionHeader}>
              <div>
                <p style={S.articleBadge}>{selectedDef.article}</p>
                <h1 style={S.missionName}>{activeMission} — {selectedDef.title}</h1>
                <p style={S.missionNarrative}>{selectedDef.narrative}</p>
              </div>
              <div style={S.statusChip(selectedMission.status)}>
                {selectedMission.status.toUpperCase()}
              </div>
            </div>

            {/* Read-only completed mission notice */}
            {selectedMission.status === 'complete' && (
              <div style={S.completedNotice}>
                ✅ This mission is complete. Steps are read-only.
              </div>
            )}

            {/* Steps */}
            <div style={S.stepsList}>
              {selectedDef.steps.map((stepDef, idx) => {
                const stepKeys = selectedDef.steps.map(s => s.id);
                const allPrevDone = stepKeys.slice(0, idx).every(k => selectedMission.steps[k]);
                const isDone = !!selectedMission.steps[stepDef.id];
                const isUnlocked = allPrevDone;
                const isNextToComplete = isUnlocked && !isDone;

                return (
                  <StepRow
                    key={stepDef.id}
                    step={stepDef}
                    stepDef={selectedDef}
                    wizardDone={isDone}
                    warning={!!warnings[stepDef.id]}
                    isUnlocked={isUnlocked}
                    isActive={isNextToComplete && selectedMission.status === 'active'}
                    missionId={activeMission}
                    onStepComplete={handleStepComplete}
                    envValues={envValues}
                    sessionToken={sessionToken}
                    setSessionToken={setSessionToken}
                    authToken={authToken}
                  />
                );
              })}
            </div>

            {/* Complete Mission Button */}
            {canCompleteMission && (
              <div style={S.completeMissionWrap}>
                <p style={S.completeMissionMsg}>All steps complete — ready to close this mission.</p>
                <button
                  onClick={() => handleCompleteMission(activeMission)}
                  disabled={completing}
                  style={S.completeMissionBtn}
                >
                  {completing ? 'Completing…' : `Complete ${activeMission} → Unlock Next Mission`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function Wizard() {
  return (
    <PinGate>
      <WizardContent />
    </PinGate>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  shell: { display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' },

  // Top navbar
  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 56, background: 'linear-gradient(90deg, #0a2d6e, #0d3b8e)', flexShrink: 0 },
  navLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  navLogo: { background: '#0099cc', color: '#fff', borderRadius: 6, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 },
  navBrand: { fontSize: 16, fontWeight: 700, color: '#fff' },
  navSep: { color: 'rgba(255,255,255,0.3)', fontSize: 16, margin: '0 4px' },
  navSection: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 },
  navRight: { display: 'flex', alignItems: 'center', gap: 12 },
  userChip: { display: 'flex', alignItems: 'center', gap: 8 },
  avatar: { width: 28, height: 28, borderRadius: '50%', background: '#0099cc', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 },
  navUserName: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  signOutBtn: { padding: '5px 12px', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, cursor: 'pointer', fontSize: 13 },

  layout: { display: 'flex', flex: 1, overflow: 'hidden', background: '#f8fafc' },

  // Sidebar
  sidebar: { width: 288, background: '#fff', borderRight: '1.5px solid #e2e8f0', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' },
  sidebarHeader: { padding: '16px 16px 14px', borderBottom: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
  logo: { background: 'linear-gradient(135deg, #0d3b8e, #0099cc)', color: '#fff', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0 },
  sidebarTitle: { fontSize: 14, fontWeight: 700, color: '#0d3b8e', marginBottom: 1 },
  sidebarSub: { fontSize: 11, color: '#94a3b8' },
  missionList: { flex: 1, overflowY: 'auto' },
  missionRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderBottom: '1px solid #f8fafc', transition: 'background 0.1s' },
  missionIcon: { fontSize: 14, flexShrink: 0, width: 20, textAlign: 'center' },
  missionId: { fontSize: 10, color: '#94a3b8', fontWeight: 700, marginBottom: 1 },
  missionTitle: { fontSize: 13, fontWeight: 500, lineHeight: 1.2 },
  expandChevron: { fontSize: 10, color: '#cbd5e1', flexShrink: 0 },
  expandedSummary: { background: '#f8fafc', borderBottom: '1px solid #f1f5f9', padding: '8px 14px 8px 48px' },
  summaryRow: { display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 4 },
  summaryTitle: { fontSize: 12, color: '#64748b', lineHeight: 1.3 },
  resetSection: { padding: '14px 16px', borderTop: '1.5px solid #e2e8f0', flexShrink: 0 },
  resetLabel: { fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: 0.8, marginBottom: 8 },
  resetRow: { display: 'flex', gap: 6 },
  resetInput: { flex: 1, padding: '7px 10px', border: '1.5px solid #e2e8f0', borderRadius: 6, fontSize: 13, outline: 'none' },
  resetBtn: { padding: '7px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  resetStatus: { fontSize: 11, color: '#64748b', marginTop: 6, lineHeight: 1.4 },

  // Main panel
  main: { flex: 1, overflowY: 'auto', padding: '36px 48px 60px' },
  fullCenter: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12, color: '#94a3b8', fontSize: 15 },

  // Mission header
  missionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, paddingBottom: 24, borderBottom: '1.5px solid #e2e8f0' },
  articleBadge: { fontSize: 11, fontWeight: 700, color: '#0099cc', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  missionName: { fontSize: 24, fontWeight: 800, color: '#0d3b8e', marginBottom: 8 },
  missionNarrative: { fontSize: 14, color: '#64748b', lineHeight: 1.6, maxWidth: 560 },
  statusChip: (s) => ({
    padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, flexShrink: 0,
    background: s === 'complete' ? '#dcfce7' : s === 'active' ? '#dbeafe' : '#f1f5f9',
    color: s === 'complete' ? '#16a34a' : s === 'active' ? '#1d4ed8' : '#64748b',
  }),
  completedNotice: { background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: '#16a34a', fontWeight: 600 },

  // Steps list
  stepsList: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 },

  // Step row
  stepRow: { display: 'flex', gap: 16, background: '#fff', borderRadius: 12, padding: '18px 20px', border: '1.5px solid #e2e8f0' },
  stepRowActive: { border: '1.5px solid #0099cc', boxShadow: '0 0 0 3px rgba(0,153,204,0.08)' },
  stepRowDone: { background: '#fafafa', border: '1.5px solid #f1f5f9' },
  stepNum: { width: 28, height: 28, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#94a3b8', flexShrink: 0, marginTop: 1 },
  stepNumActive: { background: '#0d3b8e', color: '#fff' },
  stepNumDone: { fontSize: 18, flexShrink: 0, marginTop: 1 },
  stepContent: { flex: 1, minWidth: 0 },
  stepTitle: { fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 4 },
  stepDesc: { fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 12 },
  stepDoneLabel: { fontSize: 13, color: '#94a3b8' },

  // Step actions
  stepAction: { display: 'flex', flexDirection: 'column', gap: 10 },
  doneBtn: { alignSelf: 'flex-start', padding: '9px 20px', background: '#0d3b8e', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 },
  restartNote: { background: '#fef3c7', border: '1.5px solid #fcd34d', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92400e', lineHeight: 1.5 },

  // Upload step
  uploadLabel: { cursor: 'pointer', display: 'inline-block' },
  uploadBtn: { display: 'inline-block', padding: '9px 20px', background: '#0d3b8e', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  previewTable: { border: '1.5px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', marginBottom: 12 },
  previewHeader: { display: 'flex', background: '#f1f5f9', padding: '8px 12px', gap: 12, borderBottom: '1px solid #e2e8f0' },
  previewRow: { display: 'flex', padding: '8px 12px', gap: 12, borderBottom: '1px solid #f1f5f9', fontSize: 13 },
  previewCell: { flex: 1, fontSize: 12, fontWeight: 600, color: '#374151' },

  // Snippet step
  snippetBox: { position: 'relative', background: '#0f172a', borderRadius: 8, padding: '14px 16px 48px', marginBottom: 10 },
  snippetPre: { margin: 0, fontSize: 13, color: '#e2e8f0', fontFamily: 'monospace', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-all' },
  snippetBtns: { position: 'absolute', bottom: 10, right: 10, display: 'flex', gap: 6 },
  copyBtn: { padding: '4px 10px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  downloadBtn: { padding: '4px 10px', background: '#0f766e', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 },

  // Input step
  inputLabel: { fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 },
  inputRow: { display: 'flex', gap: 8 },
  textInput: { flex: 1, padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'monospace' },
  saveBtn: { padding: '9px 18px', background: '#0099cc', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' },

  // Gate step
  gateLoading: { display: 'flex', alignItems: 'center', gap: 10, color: '#64748b', fontSize: 14, padding: '4px 0' },
  gateSpinner: { width: 18, height: 18, border: '2px solid #e2e8f0', borderTop: '2px solid #0099cc', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 },

  // Errors / retry
  errorBox: { background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 8, padding: '10px 14px' },
  errorText: { color: '#dc2626', fontSize: 13, marginBottom: 4 },
  retryRow: { display: 'flex', gap: 10, alignItems: 'center' },
  retryBtn: { padding: '7px 16px', background: '#fff', border: '1.5px solid #0d3b8e', color: '#0d3b8e', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  proceedBtn: { padding: '7px 16px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  warningBanner: { background: '#fef3c7', border: '1.5px solid #fcd34d', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92400e', lineHeight: 1.5 },
  retryHint: { fontSize: 12, color: '#94a3b8' },

  // Claims display
  claimsBox: { background: '#f0f9ff', border: '1.5px solid #bae6fd', borderRadius: 8, padding: '12px 14px', marginTop: 10 },
  claimsTitle: { fontSize: 11, fontWeight: 700, color: '#0099cc', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  claimRow: { display: 'flex', gap: 12, marginBottom: 4 },
  claimKey: { fontSize: 12, color: '#64748b', fontWeight: 600, minWidth: 80, flexShrink: 0 },
  claimVal: { fontSize: 12, color: '#0f172a', wordBreak: 'break-all', fontFamily: 'monospace' },

  // Jump to mission button
  jumpBtn: { marginTop: 10, width: '100%', padding: '7px 0', background: 'rgba(0,153,204,0.1)', color: '#0099cc', border: '1.5px solid rgba(0,153,204,0.35)', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, textAlign: 'center' },

  // Complete mission
  completeMissionWrap: { background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 12, padding: '20px 24px', textAlign: 'center' },
  completeMissionMsg: { fontSize: 14, color: '#16a34a', fontWeight: 600, marginBottom: 14 },
  completeMissionBtn: { padding: '12px 32px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 15, fontWeight: 700 },
};

// ─── Jump Modal Styles ────────────────────────────────────────────────────────

const SM = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: { background: '#fff', borderRadius: 14, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 0' },
  title: { fontSize: 18, fontWeight: 800, color: '#0d3b8e' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#94a3b8', lineHeight: 1 },
  subtitle: { fontSize: 13, color: '#64748b', lineHeight: 1.5, padding: '8px 24px 16px', margin: 0 },
  targetBadge: { margin: '12px 24px 0', padding: '10px 14px', background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 8, fontSize: 13, color: '#1d4ed8' },

  // Mission pick grid
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '0 24px 24px' },
  missionBtn: { background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 3, transition: 'border-color 0.15s' },
  missionBtnId: { fontSize: 11, fontWeight: 800, color: '#0099cc', letterSpacing: 0.5 },
  missionBtnTitle: { fontSize: 11, color: '#475569', lineHeight: 1.3 },

  // Fill form
  fieldGroup: { padding: '0 24px', marginBottom: 14 },
  fieldLabel: { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 },
  fieldInput: { width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'monospace' },
  error: { margin: '0 24px 12px', fontSize: 13, color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '8px 12px' },
  actions: { display: 'flex', gap: 10, padding: '4px 24px 24px', justifyContent: 'flex-end' },
  backBtn: { padding: '9px 18px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#64748b' },
  submitBtn: { padding: '9px 22px', background: '#0d3b8e', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700 },
};
