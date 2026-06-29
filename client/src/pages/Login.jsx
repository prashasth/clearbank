import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DescopeAuthWidget from '../components/DescopeAuthWidget.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const ADMIN_SESSION_KEY = 'clearbank_admin_token';

function AdminLoginForm({ onCancel }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post('/api/admin/verify-pin', { pin });
      if (data.success) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, data.token);
        navigate('/admin/wizard');
      } else {
        setError(data.error || 'Incorrect PIN');
        setPin('');
      }
    } catch {
      setError('Connection error — check your server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.adminForm}>
      <div style={styles.adminFormHeader}>
        <span style={styles.adminFormTitle}>Trainer / Admin Access</span>
        <button style={styles.adminFormCancel} onClick={onCancel}>✕</button>
      </div>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={pin}
          onChange={e => setPin(e.target.value)}
          placeholder="Enter Admin PIN"
          style={styles.adminInput}
          autoFocus
          disabled={loading}
        />
        {error && <p style={styles.adminError}>{error}</p>}
        <button type="submit" style={styles.adminSubmitBtn} disabled={loading || !pin}>
          {loading ? 'Verifying…' : 'Access Wizard →'}
        </button>
      </form>
    </div>
  );
}

const MOCK_ACTORS = [
  { actor: 'joel',  name: 'Joel',  role: 'Legacy Staff' },
  { actor: 'alex',  name: 'Alex',  role: 'Legacy Staff' },
  { actor: 'vicky', name: 'Vicky', role: 'Legacy Staff' },
  { actor: 'admin', name: 'Admin', role: 'Administrator' },
];

function MockLoginForm({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await axios.post('/api/verify/mock-login', { email, password });
      if (data.success) {
        onSuccess('mock-token', data.data);
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('Connection error — check your server is running.');
    }
  };

  const fillActor = (actor) => async () => {
    try {
      const { data } = await axios.get('/api/env/read');
      const base = data.data?.BASE_EMAIL || '';
      const derived = base ? base.replace('@', `+${actor.actor}@`) : `${actor.actor}@mock.dev`;
      setEmail(derived);
      setPassword(actor.actor === 'admin' ? 'Admin@2024' : 'ClearBank@2024');
      setError('');
    } catch {
      setError('Could not read BASE_EMAIL from server.');
    }
  };

  return (
    <div>
      <div style={styles.mockModeBadge}>🖥️ Local Mode — Complete Mission 3 to activate Descope authentication</div>
      <div style={styles.actorRow}>
        {MOCK_ACTORS.map(a => (
          <button key={a.actor} onClick={fillActor(a)} style={styles.actorChip}>
            {a.name}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>Email</label>
        <input style={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your+actor@gmail.com" required />
        <label style={styles.label}>Password</label>
        <input style={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••" required />
        {error && <p style={styles.errorText}>❌ {error}</p>}
        <button type="submit" style={styles.submitBtn}>Sign In →</button>
      </form>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { isMockMode, login } = useAuth();
  const [showAdminForm, setShowAdminForm] = useState(false);

  const handleSuccess = (token, user) => {
    if (isMockMode) login(token, user);
    navigate('/dashboard');
  };

  return (
    <div style={styles.page}>
      <div style={styles.leftPanel}>
        <div style={styles.leftContent}>
          <div style={styles.logoRow}>
            <div style={styles.logoMark}>CB</div>
            <span style={styles.brand}>ClearBank</span>
          </div>
          <h1 style={styles.leftHeadline}>Welcome back</h1>
          <p style={styles.leftSub}>
            Sign in to your ClearBank account to access your dashboard, make transfers, and manage your finances.
          </p>
          <div style={styles.trustBadges}>
            <div style={styles.badge}>🔐 AFASA Certified</div>
            <div style={styles.badge}>🏦 BSP Licensed</div>
            <div style={styles.badge}>🛡️ PDIC Member</div>
          </div>
        </div>
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.formWrap}>
          <h2 style={styles.formTitle}>Sign In</h2>
          <p style={styles.formSub}>Enter your credentials to continue</p>

          {isMockMode
            ? <MockLoginForm onSuccess={handleSuccess} />
            : <DescopeAuthWidget onSuccess={handleSuccess} />
          }

          <button onClick={() => navigate('/')} style={styles.backLink}>
            ← Back to ClearBank
          </button>
          {showAdminForm
            ? <AdminLoginForm onCancel={() => setShowAdminForm(false)} />
            : <button onClick={() => setShowAdminForm(true)} style={styles.adminLink}>
                Trainer / Admin Access
              </button>
          }
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
  },
  leftPanel: {
    flex: '0 0 420px',
    background: 'linear-gradient(150deg, #0a2d6e, #0d3b8e)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 40px',
  },
  leftContent: { color: '#fff' },
  logoRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 },
  logoMark: {
    background: '#0099cc',
    color: '#fff',
    borderRadius: 8,
    width: 38,
    height: 38,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 15,
  },
  brand: { fontSize: 20, fontWeight: 700 },
  leftHeadline: { fontSize: 36, fontWeight: 800, lineHeight: 1.2, marginBottom: 16, letterSpacing: -0.5 },
  leftSub: { fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 36 },
  trustBadges: { display: 'flex', flexDirection: 'column', gap: 10 },
  badge: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    background: 'rgba(255,255,255,0.08)',
    padding: '8px 14px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.1)',
  },
  rightPanel: {
    flex: 1,
    background: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 40px',
  },
  formWrap: { width: '100%', maxWidth: 420 },
  formTitle: { fontSize: 26, fontWeight: 800, color: '#0d3b8e', marginBottom: 6 },
  formSub: { fontSize: 14, color: '#64748b', marginBottom: 28 },
  mockModeBadge: {
    background: '#fef3c7',
    border: '1.5px solid #fcd34d',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 12,
    color: '#92400e',
    marginBottom: 16,
  },
  actorRow: { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  actorChip: {
    padding: '6px 14px',
    background: '#f1f5f9',
    border: '1.5px solid #e2e8f0',
    borderRadius: 20,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    color: '#0d3b8e',
  },
  form: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 12, fontWeight: 600, color: '#374151', marginTop: 8 },
  input: { padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 14, outline: 'none', marginTop: 4 },
  errorText: { color: '#dc2626', fontSize: 13, marginTop: 4 },
  submitBtn: { marginTop: 16, padding: '11px', background: '#0d3b8e', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 15, fontWeight: 700 },
  backLink: {
    display: 'block',
    marginTop: 24,
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 13,
    textAlign: 'center',
  },
  adminLink: {
    display: 'block',
    marginTop: 10,
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 12,
    textAlign: 'center',
    letterSpacing: '0.03em',
    textDecoration: 'underline',
  },
  adminForm: {
    marginTop: 20,
    padding: '16px',
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: 10,
  },
  adminFormHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  adminFormTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#0d3b8e',
  },
  adminFormCancel: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    fontSize: 14,
  },
  adminInput: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    border: '1.5px solid #cbd5e1',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: 10,
  },
  adminError: {
    color: '#dc2626',
    fontSize: 12,
    marginBottom: 8,
  },
  adminSubmitBtn: {
    width: '100%',
    padding: '10px',
    background: 'linear-gradient(135deg, #0d3b8e, #0099cc)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
  },
};
