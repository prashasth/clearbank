import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext.jsx';

const TYPE_ICON = {
  login: '🔐',
  transfer: '💸',
  stepup: '🛡️',
};

function timeAgo(date) {
  const secs = Math.floor((new Date() - date) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

export default function CustomerNotificationBell() {
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen(o => !o);
    if (!open) markAllRead();
  };

  return (
    <div ref={ref} style={S.wrap}>
      <button style={S.btn} onClick={handleOpen} title="Notifications">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span style={S.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div style={S.dropdown}>
          <div style={S.dropHeader}>Notifications</div>
          {notifications.length === 0 ? (
            <div style={S.empty}>No notifications yet</div>
          ) : (
            notifications.slice(0, 10).map(n => (
              <div key={n.id} style={S.item}>
                <span style={S.icon}>{TYPE_ICON[n.type] || '🔔'}</span>
                <div style={S.itemBody}>
                  <p style={S.itemMsg}>{n.message}</p>
                  <p style={S.itemTime}>{timeAgo(n.timestamp)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const S = {
  wrap: { position: 'relative' },
  btn: {
    position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
    padding: '4px 6px', color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center',
  },
  badge: {
    position: 'absolute', top: -2, right: -2, background: '#ef4444', color: '#fff',
    borderRadius: '50%', fontSize: 10, fontWeight: 700, minWidth: 16, height: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', lineHeight: 1,
  },
  dropdown: {
    position: 'absolute', top: 36, right: 0, width: 300, background: '#fff',
    borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', zIndex: 9999,
    border: '1px solid #e2e8f0', overflow: 'hidden',
  },
  dropHeader: {
    padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#0d3b8e',
    borderBottom: '1px solid #f1f5f9',
  },
  empty: { padding: '20px 16px', fontSize: 13, color: '#94a3b8', textAlign: 'center' },
  item: {
    display: 'flex', gap: 10, padding: '10px 16px', borderBottom: '1px solid #f8fafc',
    alignItems: 'flex-start',
  },
  icon: { fontSize: 18, flexShrink: 0, marginTop: 1 },
  itemBody: { flex: 1, minWidth: 0 },
  itemMsg: { fontSize: 13, color: '#1e293b', lineHeight: 1.4, margin: 0, marginBottom: 2 },
  itemTime: { fontSize: 11, color: '#94a3b8', margin: 0 },
};
