import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SESSION_KEY = 'clearbank_admin_token';

export function usePinGate() {
  const [authenticated, setAuthenticated] = useState(() => !!sessionStorage.getItem(SESSION_KEY));

  const authenticate = (token) => {
    sessionStorage.setItem(SESSION_KEY, token);
    setAuthenticated(true);
  };

  const revoke = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthenticated(false);
  };

  return { authenticated, authenticate, revoke };
}

export default function PinGate({ children }) {
  const { authenticated, authenticate } = usePinGate();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (authenticated) return children;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post('/api/admin/verify-pin', { pin });
      if (data.success) {
        authenticate(data.token);
      } else {
        setError(data.error || 'Incorrect PIN');
        setPin('');
      }
    } catch (err) {
      setError('Connection error — check your terminal is still running and retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.logo}>
          <span style={styles.logoText}>CB</span>
        </div>
        <h2 style={styles.title}>Admin Access</h2>
        <p style={styles.subtitle}>Enter your admin PIN to continue</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value)}
            placeholder="Enter PIN"
            style={styles.input}
            autoFocus
            disabled={loading}
          />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.button} disabled={loading || !pin}>
            {loading ? 'Verifying…' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(15, 30, 60, 0.85)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#fff',
    borderRadius: 12,
    padding: '40px 36px',
    width: 340,
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  logo: {
    width: 56, height: 56, borderRadius: 12,
    background: 'linear-gradient(135deg, #0d3b8e, #0099cc)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 16px',
  },
  logoText: { color: '#fff', fontSize: 22, fontWeight: 700 },
  title: { fontSize: 20, fontWeight: 700, color: '#0d3b8e', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 24 },
  input: {
    width: '100%', padding: '12px 14px', fontSize: 16,
    border: '1.5px solid #cbd5e1', borderRadius: 8,
    outline: 'none', marginBottom: 12,
    letterSpacing: 4, textAlign: 'center',
  },
  error: { color: '#dc2626', fontSize: 13, marginBottom: 10 },
  button: {
    width: '100%', padding: '12px', fontSize: 15, fontWeight: 600,
    background: 'linear-gradient(135deg, #0d3b8e, #0099cc)',
    color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer',
  },
};
