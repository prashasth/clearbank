import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PinGate from '../components/PinGate.jsx';

function InboxContent() {
  const [emails, setEmails] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const { data } = await axios.get('/api/inbox/all');
      if (data.success) setEmails(data.data);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const open = async (email) => {
    setSelected(email);
    if (!email.read) {
      await axios.post('/api/inbox/mark-read', { id: email.id });
      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, read: true } : e));
    }
  };

  const markAllRead = async () => {
    await axios.post('/api/inbox/mark-all-read');
    setEmails(prev => prev.map(e => ({ ...e, read: true })));
  };

  if (loading) return <div style={styles.center}>Loading inbox…</div>;

  return (
    <div style={styles.layout}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitle}>Inbox</h2>
          <button onClick={markAllRead} style={styles.markAllBtn}>Mark all read</button>
        </div>
        {emails.length === 0 && <p style={styles.empty}>No emails yet — complete missions to receive directives from Sarah Chen.</p>}
        {emails.map(email => (
          <div key={email.id} onClick={() => open(email)} style={{ ...styles.emailRow, borderLeft: email.read ? '3px solid transparent' : '3px solid #0099cc', background: selected?.id === email.id ? '#eff6ff' : '#fff' }}>
            <p style={{ ...styles.emailFrom, fontWeight: email.read ? 400 : 700 }}>{email.from}</p>
            <p style={{ ...styles.emailSubject, fontWeight: email.read ? 400 : 700 }}>{email.subject}</p>
            <p style={styles.emailTime}>{new Date(email.timestamp).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
      <div style={styles.detail}>
        {selected ? (
          <div>
            <div style={styles.detailHeader}>
              <h2 style={styles.detailSubject}>{selected.subject}</h2>
              <div style={styles.meta}>
                <p><strong>From:</strong> {selected.from}</p>
                <p><strong>To:</strong> {selected.to}</p>
                <p><strong>Date:</strong> {new Date(selected.timestamp).toLocaleString()}</p>
              </div>
            </div>
            <div style={styles.body} dangerouslySetInnerHTML={{ __html: selected.body }} />
            <button onClick={() => navigate('/admin/wizard')} style={styles.wizardBtn}>Go to Mission Wizard →</button>
          </div>
        ) : (
          <div style={styles.empty}>Select an email to read</div>
        )}
      </div>
    </div>
  );
}

export default function AdminInbox() {
  return (
    <PinGate>
      <div style={styles.page}>
        <InboxContent />
      </div>
    </PinGate>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f0f4f8' },
  layout: { display: 'flex', height: '100vh' },
  sidebar: { width: 340, borderRight: '1.5px solid #e2e8f0', background: '#fff', overflowY: 'auto', flexShrink: 0 },
  sidebarHeader: { padding: '16px 20px', borderBottom: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  sidebarTitle: { fontSize: 18, fontWeight: 700, color: '#0d3b8e' },
  markAllBtn: { background: 'none', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer' },
  emailRow: { padding: '14px 20px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' },
  emailFrom: { fontSize: 13, color: '#374151', marginBottom: 3 },
  emailSubject: { fontSize: 14, color: '#1e293b', marginBottom: 4, lineHeight: 1.3 },
  emailTime: { fontSize: 11, color: '#94a3b8' },
  detail: { flex: 1, overflowY: 'auto', padding: '32px 40px' },
  detailHeader: { marginBottom: 24, paddingBottom: 20, borderBottom: '1.5px solid #e2e8f0' },
  detailSubject: { fontSize: 20, fontWeight: 700, color: '#0d3b8e', marginBottom: 12 },
  meta: { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: '#64748b' },
  body: { fontSize: 15, color: '#334155', lineHeight: 1.8 },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#64748b' },
  empty: { padding: 24, color: '#94a3b8', fontSize: 14, textAlign: 'center' },
  wizardBtn: { marginTop: 24, padding: '10px 20px', background: '#0d3b8e', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 },
};
