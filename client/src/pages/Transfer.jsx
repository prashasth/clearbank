import React from 'react';
import { useNavigate } from 'react-router-dom';
import TransferForm from '../components/TransferForm.jsx';
import NotificationBell from '../components/NotificationBell.jsx';

export default function Transfer() {
  const navigate = useNavigate();

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
          <div>
            <h1 style={styles.title}>Transfer Funds</h1>
            <p style={styles.sub}>Send money to your contacts instantly</p>
          </div>
          <div style={styles.afasaBadge}>
            <span>🛡️</span>
            <span style={styles.afasaText}>AFASA Article 8 Protected</span>
          </div>
        </div>

        <div style={styles.layout}>
          <div style={styles.formCard}>
            <TransferForm />
          </div>

          <div style={styles.infoPanel}>
            <div style={styles.infoCard}>
              <h3 style={styles.infoTitle}>Transfer Limits</h3>
              <div style={styles.limitRow}>
                <span style={styles.limitLabel}>Standard Transfer</span>
                <span style={styles.limitVal}>Up to ₱50,000</span>
              </div>
              <div style={styles.limitRow}>
                <span style={styles.limitLabel}>High-Value Transfer</span>
                <span style={styles.limitVal}>Above ₱50,000*</span>
              </div>
              <p style={styles.limitNote}>* Requires step-up authentication per AFASA Article 8</p>
            </div>

            <div style={styles.infoCard}>
              <h3 style={styles.infoTitle}>Available Recipients</h3>
              {[
                { name: 'Alex Reyes', role: 'ClearBank Customer' },
                { name: 'Vicky Cruz', role: 'ClearBank Customer' },
                { name: 'Jane Lim', role: 'ClearBank Customer' },
              ].map((r, i) => (
                <div key={i} style={styles.recipientRow}>
                  <div style={styles.recipientAvatar}>{r.name[0]}</div>
                  <div>
                    <p style={styles.recipientName}>{r.name}</p>
                    <p style={styles.recipientRole}>{r.role}</p>
                  </div>
                </div>
              ))}
            </div>
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
  main: { maxWidth: 960, margin: '0 auto', padding: '36px 24px 60px' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  title: { fontSize: 26, fontWeight: 800, color: '#0d3b8e', marginBottom: 4 },
  sub: { fontSize: 14, color: '#64748b' },
  afasaBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: '#eff6ff',
    border: '1.5px solid #bfdbfe',
    borderRadius: 8,
    padding: '8px 14px',
  },
  afasaText: { fontSize: 12, fontWeight: 600, color: '#1d4ed8' },
  layout: { display: 'flex', gap: 24, alignItems: 'flex-start' },
  formCard: {
    flex: '1 1 0',
    background: '#fff',
    borderRadius: 14,
    padding: '28px',
    border: '1.5px solid #e2e8f0',
    minWidth: 0,
  },
  infoPanel: { flex: '0 0 260px', display: 'flex', flexDirection: 'column', gap: 16 },
  infoCard: {
    background: '#fff',
    borderRadius: 12,
    padding: '20px',
    border: '1.5px solid #e2e8f0',
  },
  infoTitle: { fontSize: 14, fontWeight: 700, color: '#0d3b8e', marginBottom: 14 },
  limitRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 },
  limitLabel: { fontSize: 13, color: '#64748b' },
  limitVal: { fontSize: 13, fontWeight: 600, color: '#1e293b' },
  limitNote: { fontSize: 11, color: '#94a3b8', marginTop: 8, lineHeight: 1.5 },
  recipientRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  recipientAvatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: '#dbeafe',
    color: '#1d4ed8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
  },
  recipientName: { fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 1 },
  recipientRole: { fontSize: 11, color: '#94a3b8' },
};
