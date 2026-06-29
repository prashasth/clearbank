import React from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell.jsx';

export default function Home() {
  const projectId = import.meta.env.VITE_DESCOPE_PROJECT_ID;
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      {!projectId && (
        <div style={styles.modeBanner}>
          🖥️ Local Mode — Descope not yet configured. Complete Mission 3 to activate authentication.
        </div>
      )}

      <nav style={styles.nav}>
        <div style={styles.navLeft}>
          <div style={styles.logoWrap}>
            <span style={styles.logoMark}>CB</span>
            <span style={styles.brand}>ClearBank</span>
          </div>
        </div>
        <div style={styles.navRight}>
          <NotificationBell />
          <button onClick={() => navigate('/login')} style={styles.signInBtn}>Sign In</button>
        </div>
      </nav>

      <main style={styles.hero}>
        <div style={styles.heroLeft}>
          <p style={styles.eyebrow}>AFASA Certified · BSP Licensed</p>
          <h1 style={styles.headline}>Clear.<br />Secure.<br />Yours.</h1>
          <p style={styles.tagline}>
            ClearBank Philippines — your trusted digital banking partner, built on the strongest identity security in the region.
          </p>
          <div style={styles.ctaRow}>
            <button onClick={() => navigate('/login')} style={styles.ctaPrimary}>
              Sign In to ClearBank
            </button>
            <button onClick={() => navigate('/admin/wizard')} style={styles.ctaSecondary}>
              Admin Wizard
            </button>
          </div>
        </div>

        <div style={styles.heroRight}>
          <div style={styles.cardStack}>
            <div style={{ ...styles.floatCard, ...styles.cardBack }} />
            <div style={styles.mainCard}>
              <div style={styles.cardChip} />
              <div style={styles.cardTop}>
                <span style={styles.cardBank}>ClearBank</span>
                <span style={styles.cardType}>VISA</span>
              </div>
              <div style={styles.cardNumber}>•••• •••• •••• 4821</div>
              <div style={styles.cardBottom}>
                <div>
                  <p style={styles.cardLabel}>Checking Balance</p>
                  <p style={styles.cardBalance}>₱ 124,500.00</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={styles.cardLabel}>Card Holder</p>
                  <p style={styles.cardHolder}>Joel Santos</p>
                </div>
              </div>
            </div>
          </div>

          <div style={styles.statRow}>
            <div style={styles.stat}>
              <p style={styles.statVal}>₱ 209,730</p>
              <p style={styles.statLabel}>Total Assets</p>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.stat}>
              <p style={styles.statVal}>13</p>
              <p style={styles.statLabel}>Transactions</p>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.stat}>
              <p style={styles.statVal}>AFASA</p>
              <p style={styles.statLabel}>Compliant</p>
            </div>
          </div>
        </div>
      </main>

      <footer style={styles.footer}>
        <p style={styles.footerCopy}>© 2024 ClearBank Philippines · Regulated by BSP · Member PDIC</p>
        <div style={styles.footerLinks}>
          <button onClick={() => navigate('/admin/inbox')} style={styles.footerLink}>Admin Inbox</button>
          <button onClick={() => navigate('/admin/wizard')} style={styles.footerLink}>Mission Wizard</button>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(150deg, #0a2d6e 0%, #0d3b8e 40%, #0a4a8a 70%, #083d7a 100%)',
  },
  modeBanner: {
    background: '#fef3c7',
    color: '#92400e',
    padding: '10px 24px',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: 500,
    borderBottom: '1px solid #fde68a',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 48px',
  },
  navLeft: { display: 'flex', alignItems: 'center' },
  navRight: { display: 'flex', alignItems: 'center', gap: 12 },
  logoWrap: { display: 'flex', alignItems: 'center', gap: 10 },
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
  brand: { color: '#fff', fontSize: 22, fontWeight: 700, letterSpacing: -0.5 },
  signInBtn: {
    padding: '9px 22px',
    background: 'rgba(255,255,255,0.15)',
    color: '#fff',
    border: '1.5px solid rgba(255,255,255,0.4)',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    backdropFilter: 'blur(4px)',
  },
  hero: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '60px 48px 80px',
    gap: 60,
  },
  heroLeft: { maxWidth: 480 },
  eyebrow: {
    fontSize: 12,
    fontWeight: 700,
    color: '#0099cc',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  headline: {
    fontSize: 64,
    fontWeight: 900,
    color: '#fff',
    lineHeight: 1.05,
    marginBottom: 24,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.65,
    marginBottom: 36,
  },
  ctaRow: { display: 'flex', gap: 14, flexWrap: 'wrap' },
  ctaPrimary: {
    padding: '14px 32px',
    background: '#0099cc',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(0,153,204,0.4)',
  },
  ctaSecondary: {
    padding: '14px 24px',
    background: 'rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.85)',
    border: '1.5px solid rgba(255,255,255,0.25)',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
  heroRight: { flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' },
  cardStack: { position: 'relative', width: 340 },
  floatCard: {
    position: 'absolute',
    inset: 0,
    borderRadius: 20,
    opacity: 0.4,
  },
  cardBack: {
    background: '#0099cc',
    transform: 'rotate(6deg) translateY(-8px)',
    zIndex: 0,
  },
  mainCard: {
    position: 'relative',
    zIndex: 1,
    background: 'linear-gradient(135deg, #0d3b8e 0%, #0099cc 100%)',
    borderRadius: 20,
    padding: '28px 28px 24px',
    boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
    color: '#fff',
  },
  cardChip: {
    width: 40,
    height: 30,
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    borderRadius: 6,
    marginBottom: 24,
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  cardBank: { fontSize: 18, fontWeight: 800, letterSpacing: -0.5 },
  cardType: { fontSize: 20, fontWeight: 900, fontStyle: 'italic', opacity: 0.9 },
  cardNumber: { fontSize: 16, letterSpacing: 3, marginBottom: 28, opacity: 0.8 },
  cardBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardLabel: { fontSize: 10, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  cardBalance: { fontSize: 20, fontWeight: 700 },
  cardHolder: { fontSize: 14, fontWeight: 600 },
  statRow: {
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(8px)',
    borderRadius: 12,
    padding: '16px 28px',
    display: 'flex',
    gap: 24,
    alignItems: 'center',
    width: '100%',
    border: '1px solid rgba(255,255,255,0.15)',
  },
  stat: { textAlign: 'center', flex: 1 },
  statVal: { color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 3 },
  statLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, height: 32, background: 'rgba(255,255,255,0.2)' },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 48px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  footerCopy: { fontSize: 12, color: 'rgba(255,255,255,0.35)' },
  footerLinks: { display: 'flex', gap: 20 },
  footerLink: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.4)',
    cursor: 'pointer',
    fontSize: 12,
    textDecoration: 'underline',
  },
};
