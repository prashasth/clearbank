import React, { useState } from 'react';
import { Descope } from '@descope/react-sdk';
import { useNavigate } from 'react-router-dom';

export default function DescopeAuthWidget({ onSuccess, onError }) {
  const flowId = import.meta.env.VITE_FLOW_ID;
  const projectId = import.meta.env.VITE_DESCOPE_PROJECT_ID;
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  if (!projectId || !flowId) {
    return (
      <div style={styles.placeholder}>
        <div style={styles.placeholderIcon}>🔐</div>
        <p style={styles.placeholderText}>
          No flow configured yet — complete Mission 3 to activate
        </p>
      </div>
    );
  }

  const handleSuccess = (e) => {
    setError(null);
    const sessionToken = e.detail?.sessionJwt || e.detail?.sessionToken;
    const user = e.detail?.user;
    if (onSuccess) onSuccess(sessionToken, user);
    navigate('/dashboard');
  };

  const handleError = (e) => {
    const err = e.detail || e;
    console.error('[DescopeAuthWidget] error:', err);
    setError(err?.errorMessage || err?.message || 'Authentication failed');
    if (onError) onError(err);
  };

  return (
    <div>
      {error && (
        <div style={styles.errorBox}>
          <p style={styles.errorText}>{error}</p>
          <button onClick={() => setError(null)} style={styles.retryBtn}>Try Again</button>
        </div>
      )}
      <Descope
        flowId={flowId}
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </div>
  );
}

const styles = {
  placeholder: {
    border: '2px dashed #cbd5e1',
    borderRadius: 12,
    padding: '48px 24px',
    textAlign: 'center',
    background: '#f8fafc',
  },
  placeholderIcon: { fontSize: 36, marginBottom: 12 },
  placeholderText: { color: '#64748b', fontSize: 15, lineHeight: 1.5 },
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
};
