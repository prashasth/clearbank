import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SESSION_KEY = 'clearbank_admin_token';

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const [toasts, setToasts] = useState([]); // [{ id, subject, from, missionId, fading }]
  const seenIdsRef = useRef(null); // null = first load, Set after first poll
  const navigate = useNavigate();

  const dismissToast = (id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, fading: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 700);
  };

  const enqueueToast = (email) => {
    const toast = { id: email.id, subject: email.subject, from: email.from, missionId: email.missionId, fading: false };
    setToasts(prev => [...prev, toast]);
    setTimeout(() => dismissToast(email.id), 4000);
  };

  useEffect(() => {
    setVisible(!!sessionStorage.getItem(SESSION_KEY));

    const poll = async () => {
      if (!sessionStorage.getItem(SESSION_KEY)) return;
      try {
        const { data } = await axios.get('/api/inbox/all');
        if (!data.success) return;

        const allEmails = data.data;
        const unread = allEmails.filter(e => !e.read);
        setCount(unread.length);
        setVisible(true);

        if (seenIdsRef.current === null) {
          // First load — mark all current emails as seen, no toasts
          seenIdsRef.current = new Set(allEmails.map(e => e.id));
        } else {
          // Find emails we haven't seen before
          const newEmails = allEmails.filter(e => !seenIdsRef.current.has(e.id));
          newEmails.forEach((email, i) => {
            seenIdsRef.current.add(email.id);
            // Stagger toasts slightly if multiple arrive at once
            setTimeout(() => enqueueToast(email), i * 400);
          });
        }
      } catch (_) {}
    };

    poll();
    const id = setInterval(poll, 10000);
    return () => clearInterval(id);
  }, []);

  if (!visible) return null;

  return (
    <>
      <button onClick={() => navigate('/admin/inbox')} style={styles.btn} title="Admin Inbox">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {count > 0 && <span style={styles.badge}>{count > 9 ? '9+' : count}</span>}
      </button>

      <div style={styles.toastStack}>
        {toasts.map((toast) => {
          const senderName = toast.from?.replace(/<.*>/, '').trim() ?? '';
          return (
            <div
              key={toast.id}
              style={{ ...styles.toast, opacity: toast.fading ? 0 : 1 }}
              onClick={() => navigate('/admin/inbox')}
            >
              <div style={styles.toastHeader}>
                <span style={styles.toastMission}>{toast.missionId}</span>
                <span style={styles.toastFrom}>{senderName}</span>
                <button
                  style={styles.toastClose}
                  onClick={(e) => { e.stopPropagation(); dismissToast(toast.id); }}
                >×</button>
              </div>
              <div style={styles.toastSubject}>{toast.subject.replace(/^\[M\d+\]\s*/, '')}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}

const styles = {
  btn: {
    position: 'relative',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 6px',
    color: 'rgba(255,255,255,0.85)',
    display: 'flex',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    background: '#ef4444',
    color: '#fff',
    borderRadius: '50%',
    fontSize: 10,
    fontWeight: 700,
    minWidth: 16,
    height: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 3px',
    lineHeight: 1,
  },
  toastStack: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    zIndex: 9999,
    pointerEvents: 'none',
  },
  toast: {
    background: '#1e293b',
    border: '1px solid rgba(255,255,255,0.12)',
    borderLeft: '3px solid #3b82f6',
    borderRadius: 8,
    padding: '12px 16px',
    width: 300,
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    transition: 'opacity 0.7s ease',
    pointerEvents: 'auto',
  },
  toastHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },
  toastMission: {
    background: '#3b82f6',
    color: '#fff',
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 4,
    padding: '2px 6px',
    letterSpacing: '0.05em',
    flexShrink: 0,
  },
  toastFrom: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  toastClose: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.4)',
    cursor: 'pointer',
    fontSize: 16,
    lineHeight: 1,
    padding: '0 2px',
    flexShrink: 0,
  },
  toastSubject: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: 500,
    lineHeight: 1.4,
  },
};
