import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import NotificationBell from '../components/NotificationBell.jsx';
import axios from 'axios';

export default function AccountBalance() {
  const { sessionToken, isMockMode } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('validating'); // validating | valid | invalid | error
  const [claims, setClaims] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const validate = async () => {
      if (isMockMode) {
        setStatus('valid');
        return;
      }
      try {
        const { data } = await axios.post('/api/verify/session', { sessionToken });
        if (data.success) {
          setClaims(data.data?.token || data.data);
          setStatus('valid');
        } else {
          setErrorMsg(data.error || 'Session invalid');
          setStatus('invalid');
          setTimeout(() => navigate('/login'), 2500);
        }
      } catch (_) {
        setErrorMsg('Connection error — check your terminal is still running and retry.');
        setStatus('error');
        setTimeout(() => navigate('/login'), 2500);
      }
    };
    validate();
  }, []);

  if (status === 'validating') {
    return (
      <div style={styles.fullCenter}>
        <div style={styles.spinner} />
        <p style={styles.spinnerText}>Validating session…</p>
        <p style={styles.spinnerSub}>AFASA Article 7 — Server-side session verification</p>
      </div>
    );
  }

  if (status === 'invalid' || status === 'error') {
    return (
      <div style={styles.fullCenter}>
        <div style={styles.errorIcon}>🔒</div>
        <p style={styles.errorTitle}>Session Invalid</p>
        <p style={styles.errorMsg}>{errorMsg}</p>
        <p style={styles.errorSub}>Redirecting to login…</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={styles.navLeft}>
          <div style={styles.logoMark}>CB</div>
          <span style={styles.brand}>ClearBank</span>
        </div>
        <div style={styles.navRight}>
          <NotificationBell />
          <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>← Dashboard</button>
        </div>
      </nav>

      <main style={styles.main}>
        <div style={styles.pageHeader}>
          <h1 style={styles.title}>Account Balance</h1>
          {isMockMode ? (
            <span style={styles.mockTag}>🖥️ Mock Mode</span>
          ) : (
            <span style={styles.verifiedTag}>✅ Session Verified</span>
          )}
        </div>

        {!isMockMode && claims && (
          <div style={styles.sessionBox}>
            <p style={styles.sessionTitle}>Session Claims (AFASA Article 7)</p>
            <div style={styles.claimsGrid}>
              {claims.sub && <div style={styles.claim}><span style={styles.claimKey}>Subject</span><span style={styles.claimVal}>{claims.sub}</span></div>}
              {claims.email && <div style={styles.claim}><span style={styles.claimKey}>Email</span><span style={styles.claimVal}>{claims.email}</span></div>}
              {claims.amr && <div style={styles.claim}><span style={styles.claimKey}>Auth Methods</span><span style={styles.claimVal}>{claims.amr.join(', ')}</span></div>}
              {claims.exp && <div style={styles.claim}><span style={styles.claimKey}>Expires</span><span style={styles.claimVal}>{new Date(claims.exp * 1000).toLocaleString()}</span></div>}
            </div>
          </div>
        )}

        <div style={styles.totalCard}>
          <p style={styles.totalLabel}>Total Balance</p>
          <p style={styles.totalAmount}>₱ 209,730.50</p>
          <p style={styles.totalSub}>Across all accounts</p>
        </div>

        <div style={styles.accountList}>
          {[
            { name: 'Checking Account', num: '**** 4821', balance: '₱ 124,500.00', color: '#0d3b8e' },
            { name: 'Savings Account', num: '**** 3902', balance: '₱ 85,230.50', color: '#047857' },
          ].map((acc, i) => (
            <div key={i} style={styles.accountRow}>
              <div style={{ ...styles.accountDot, background: acc.color }} />
              <div style={styles.accountInfo}>
                <p style={styles.accountName}>{acc.name}</p>
                <p style={styles.accountNum}>{acc.num}</p>
              </div>
              <p style={styles.accountBal}>{acc.balance}</p>
            </div>
          ))}
        </div>

        <button onClick={() => navigate('/transfer')} style={styles.transferBtn}>
          Make a Transfer →
        </button>
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f0f4f8' },
  fullCenter: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    background: '#f0f4f8',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '3px solid #e2e8f0',
    borderTop: '3px solid #0099cc',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  spinnerText: { fontSize: 16, fontWeight: 600, color: '#0d3b8e' },
  spinnerSub: { fontSize: 12, color: '#94a3b8' },
  errorIcon: { fontSize: 48 },
  errorTitle: { fontSize: 20, fontWeight: 700, color: '#dc2626' },
  errorMsg: { fontSize: 14, color: '#64748b' },
  errorSub: { fontSize: 13, color: '#94a3b8' },
  nav: {
    background: '#0d3b8e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    height: 60,
  },
  navLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  navRight: { display: 'flex', alignItems: 'center', gap: 12 },
  logoMark: {
    background: '#0099cc',
    color: '#fff',
    borderRadius: 6,
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 13,
  },
  brand: { color: '#fff', fontSize: 18, fontWeight: 700 },
  backBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.75)',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
  },
  main: { maxWidth: 640, margin: '0 auto', padding: '40px 24px' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  title: { fontSize: 26, fontWeight: 800, color: '#0d3b8e' },
  verifiedTag: {
    fontSize: 13,
    fontWeight: 600,
    color: '#16a34a',
    background: '#dcfce7',
    padding: '5px 12px',
    borderRadius: 20,
  },
  mockTag: {
    fontSize: 13,
    fontWeight: 600,
    color: '#92400e',
    background: '#fef3c7',
    padding: '5px 12px',
    borderRadius: 20,
  },
  sessionBox: {
    background: '#fff',
    border: '1.5px solid #e2e8f0',
    borderRadius: 12,
    padding: '20px 24px',
    marginBottom: 24,
  },
  sessionTitle: { fontSize: 12, fontWeight: 700, color: '#0099cc', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  claimsGrid: { display: 'flex', flexDirection: 'column', gap: 8 },
  claim: { display: 'flex', gap: 12, alignItems: 'flex-start' },
  claimKey: { fontSize: 12, color: '#94a3b8', fontWeight: 600, minWidth: 100 },
  claimVal: { fontSize: 13, color: '#334155', wordBreak: 'break-all' },
  totalCard: {
    background: 'linear-gradient(135deg, #0d3b8e, #0099cc)',
    borderRadius: 16,
    padding: '32px',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    boxShadow: '0 8px 24px rgba(13,59,142,0.3)',
  },
  totalLabel: { fontSize: 14, opacity: 0.7, marginBottom: 8 },
  totalAmount: { fontSize: 40, fontWeight: 900, marginBottom: 8 },
  totalSub: { fontSize: 13, opacity: 0.6 },
  accountList: {
    background: '#fff',
    borderRadius: 12,
    border: '1.5px solid #e2e8f0',
    overflow: 'hidden',
    marginBottom: 24,
  },
  accountRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '16px 20px',
    borderBottom: '1px solid #f1f5f9',
  },
  accountDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  accountInfo: { flex: 1 },
  accountName: { fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 2 },
  accountNum: { fontSize: 12, color: '#94a3b8', letterSpacing: 1 },
  accountBal: { fontSize: 16, fontWeight: 700, color: '#0d3b8e' },
  transferBtn: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #0d3b8e, #0099cc)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
};
