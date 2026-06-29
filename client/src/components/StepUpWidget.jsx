import React, { useState } from 'react';
import { Descope } from '@descope/react-sdk';

export default function StepUpWidget({ onSuccess, onCancel }) {
  const flowId = import.meta.env.VITE_STEPUP_FLOW_ID;
  const projectId = import.meta.env.VITE_DESCOPE_PROJECT_ID;
  const [error, setError] = useState(null);

  const handleSuccess = (e) => {
    setError(null);
    if (onSuccess) onSuccess(e.detail);
  };

  const handleError = (e) => {
    const err = e.detail || e;
    setError(err?.errorMessage || err?.message || 'Step-up verification failed');
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div style={styles.icon}>🔒</div>
          <h2 style={styles.title}>Additional Verification Required</h2>
          <p style={styles.sub}>
            This transfer exceeds ₱50,000 and requires step-up authentication per AFASA Article 8.
          </p>
        </div>

        {!projectId || !flowId ? (
          <div style={styles.notConfigured}>
            <p>Step-up not configured — complete Mission 10 first</p>
          </div>
        ) : (
          <div>
            {error && (
              <div style={styles.errorBox}>
                <p style={styles.errorText}>❌ {error}</p>
                <button onClick={() => setError(null)} style={styles.retryBtn}>Retry</button>
              </div>
            )}
            <Descope
              flowId={flowId}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </div>
        )}

        <button onClick={onCancel} style={styles.cancelBtn}>Cancel Transfer</button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(15, 30, 60, 0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 999, padding: 24,
  },
  modal: {
    background: '#fff',
    borderRadius: 16,
    padding: '32px 28px',
    width: '100%',
    maxWidth: 440,
    boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  header: { textAlign: 'center', marginBottom: 24 },
  icon: { fontSize: 36, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: 700, color: '#0d3b8e', marginBottom: 8 },
  sub: { fontSize: 14, color: '#64748b', lineHeight: 1.5 },
  notConfigured: {
    background: '#fef3c7',
    border: '1.5px solid #fcd34d',
    borderRadius: 8,
    padding: '16px',
    textAlign: 'center',
    color: '#92400e',
    fontSize: 14,
    marginBottom: 16,
  },
  errorBox: {
    background: '#fef2f2',
    border: '1.5px solid #fca5a5',
    borderRadius: 8,
    padding: '12px 16px',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: { color: '#dc2626', fontSize: 14, marginBottom: 8 },
  retryBtn: {
    padding: '6px 16px',
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
  },
  cancelBtn: {
    display: 'block',
    width: '100%',
    marginTop: 16,
    padding: '10px',
    background: 'none',
    border: '1.5px solid #e2e8f0',
    borderRadius: 8,
    color: '#64748b',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
  },
};
