import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import CustomerNotificationBell from '../components/CustomerNotificationBell.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { addNotification, clearNotifications } = useNotifications();

  const handleLogout = async () => {
    clearNotifications();
    await logout();
    navigate('/');
  };

  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (notifiedRef.current) return;
    notifiedRef.current = true;
    addNotification('login', `Welcome back, ${firstName}! You signed in successfully.`);
  }, []);

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={styles.navLeft}>
          <div style={styles.logoMark}>CB</div>
          <span style={styles.brand}>ClearBank</span>
        </div>
        <div style={styles.navRight}>
          <CustomerNotificationBell />
          <div style={styles.userChip}>
            <div style={styles.avatar}>{firstName[0].toUpperCase()}</div>
            <span style={styles.userName}>{firstName}</span>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>Sign Out</button>
        </div>
      </nav>

      <main style={styles.main}>
        <div style={styles.pageHeader}>
          <div>
            <p style={styles.greetingLabel}>{getGreeting()}</p>
            <h1 style={styles.greeting}>{firstName}</h1>
          </div>
          <p style={styles.lastLogin}>Last login: {new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Account Cards */}
        <div style={styles.cardRow}>
          <div style={styles.accountCard}>
            <div style={styles.cardHeader}>
              <p style={styles.cardType}>Checking Account</p>
              <span style={styles.cardTag}>PRIMARY</span>
            </div>
            <p style={styles.cardBal}>₱ 124,500.00</p>
            <p style={styles.cardNum}>**** **** **** 4821</p>
            <div style={styles.cardFooter}>
              <span style={styles.cardFooterText}>Available Balance</span>
            </div>
          </div>

          <div style={{ ...styles.accountCard, background: 'linear-gradient(135deg, #047857, #059669)' }}>
            <div style={styles.cardHeader}>
              <p style={styles.cardType}>Savings Account</p>
              <span style={styles.cardTag}>SAVINGS</span>
            </div>
            <p style={styles.cardBal}>₱ 85,230.50</p>
            <p style={styles.cardNum}>**** **** **** 3902</p>
            <div style={styles.cardFooter}>
              <span style={styles.cardFooterText}>Available Balance</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Quick Actions</h2>
          <div style={styles.actionGrid}>
            <button onClick={() => navigate('/transfer')} style={styles.actionCard}>
              <div style={{ ...styles.actionIcon, background: '#dbeafe' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
                </svg>
              </div>
              <p style={styles.actionLabel}>Transfer</p>
              <p style={styles.actionSub}>Send money</p>
            </button>

            <button onClick={() => navigate('/balance')} style={styles.actionCard}>
              <div style={{ ...styles.actionIcon, background: '#dcfce7' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <p style={styles.actionLabel}>Balance</p>
              <p style={styles.actionSub}>View accounts</p>
            </button>

            <button style={{ ...styles.actionCard, opacity: 0.5, cursor: 'not-allowed' }}>
              <div style={{ ...styles.actionIcon, background: '#f3e8ff' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <p style={styles.actionLabel}>Transactions</p>
              <p style={styles.actionSub}>Coming soon</p>
            </button>

            <button style={{ ...styles.actionCard, opacity: 0.5, cursor: 'not-allowed' }}>
              <div style={{ ...styles.actionIcon, background: '#fef3c7' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                </svg>
              </div>
              <p style={styles.actionLabel}>Statements</p>
              <p style={styles.actionSub}>Coming soon</p>
            </button>
          </div>
        </div>

        {/* Recent Activity (mock) */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Recent Activity</h2>
          <div style={styles.txList}>
            {[
              { label: 'Transfer to Alex', amount: '-₱ 5,000.00', date: 'Today', type: 'out' },
              { label: 'Salary Deposit', amount: '+₱ 45,000.00', date: 'Yesterday', type: 'in' },
              { label: 'Transfer to Vicky', amount: '-₱ 2,500.00', date: 'Dec 14', type: 'out' },
            ].map((tx, i) => (
              <div key={i} style={styles.txRow}>
                <div style={styles.txLeft}>
                  <div style={{ ...styles.txIcon, background: tx.type === 'in' ? '#dcfce7' : '#fee2e2' }}>
                    {tx.type === 'in' ? '↓' : '↑'}
                  </div>
                  <div>
                    <p style={styles.txLabel}>{tx.label}</p>
                    <p style={styles.txDate}>{tx.date}</p>
                  </div>
                </div>
                <p style={{ ...styles.txAmount, color: tx.type === 'in' ? '#16a34a' : '#dc2626' }}>{tx.amount}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f0f4f8' },
  nav: {
    background: '#0d3b8e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    height: 60,
    boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
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
  userChip: { display: 'flex', alignItems: 'center', gap: 8 },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    background: '#0099cc',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 700,
  },
  userName: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  wizardBtn: {
    padding: '6px 14px',
    background: 'rgba(255,255,255,0.15)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
  },
  logoutBtn: {
    padding: '6px 14px',
    background: 'rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.85)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
  },
  main: { maxWidth: 920, margin: '0 auto', padding: '36px 24px 60px' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 },
  greetingLabel: { fontSize: 14, color: '#64748b', marginBottom: 4 },
  greeting: { fontSize: 30, fontWeight: 800, color: '#0d3b8e' },
  lastLogin: { fontSize: 13, color: '#94a3b8' },
  cardRow: { display: 'flex', gap: 20, marginBottom: 36, flexWrap: 'wrap' },
  accountCard: {
    flex: '1 1 280px',
    background: 'linear-gradient(135deg, #0d3b8e, #0066a0)',
    borderRadius: 16,
    padding: '24px 28px',
    color: '#fff',
    boxShadow: '0 8px 24px rgba(13,59,142,0.3)',
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardType: { fontSize: 13, opacity: 0.7 },
  cardTag: { fontSize: 10, fontWeight: 700, letterSpacing: 1, background: 'rgba(255,255,255,0.15)', padding: '3px 8px', borderRadius: 4 },
  cardBal: { fontSize: 28, fontWeight: 800, marginBottom: 12 },
  cardNum: { fontSize: 14, opacity: 0.5, letterSpacing: 2, marginBottom: 20 },
  cardFooter: { borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 12 },
  cardFooterText: { fontSize: 12, opacity: 0.6 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 16 },
  actionGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 },
  actionCard: {
    background: '#fff',
    border: '1.5px solid #e2e8f0',
    borderRadius: 12,
    padding: '20px 16px',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'border-color 0.15s',
  },
  actionIcon: { width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' },
  actionLabel: { fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 3 },
  actionSub: { fontSize: 12, color: '#94a3b8' },
  txList: { background: '#fff', borderRadius: 12, border: '1.5px solid #e2e8f0', overflow: 'hidden' },
  txRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #f1f5f9' },
  txLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  txIcon: { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 },
  txLabel: { fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 2 },
  txDate: { fontSize: 12, color: '#94a3b8' },
  txAmount: { fontSize: 15, fontWeight: 700 },
};
