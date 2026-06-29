import React, { useState } from 'react';
import StepUpWidget from './StepUpWidget.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';

const THRESHOLD = Number(import.meta.env.VITE_TRANSFER_THRESHOLD) || 50000;
const RECIPIENTS = [
  { id: 'alex', name: 'Alex Reyes' },
  { id: 'vicky', name: 'Vicky Cruz' },
  { id: 'jane', name: 'Jane Lim' },
];

export default function TransferForm() {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState(RECIPIENTS[0].id);
  const [note, setNote] = useState('');
  const [showStepUp, setShowStepUp] = useState(false);
  const [result, setResult] = useState(null);
  const { addNotification } = useNotifications();

  const recipientName = RECIPIENTS.find(r => r.id === recipient)?.name;
  const numAmount = Number(amount);
  const needsStepUp = numAmount > THRESHOLD;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || numAmount <= 0) return;
    if (needsStepUp) {
      setShowStepUp(true);
    } else {
      finalize();
    }
  };

  const finalize = (verified = false) => {
    const msg = `₱${numAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })} transferred to ${recipientName}`;
    setResult({ success: true, message: msg, verified });
    addNotification('transfer', msg);
    setAmount('');
    setNote('');
  };

  const handleStepUpSuccess = () => {
    setShowStepUp(false);
    addNotification('stepup', 'Identity verified — high-value transfer authorised.');
    finalize(true);
  };

  const handleStepUpCancel = () => {
    setShowStepUp(false);
    setResult({
      success: false,
      message: 'Transfer cancelled — step-up authentication is required for amounts above ₱50,000.',
    });
  };

  if (result) {
    return (
      <div style={styles.result}>
        <div style={styles.resultIcon}>{result.success ? '✅' : '❌'}</div>
        <h3 style={{ ...styles.resultTitle, color: result.success ? '#16a34a' : '#dc2626' }}>
          {result.success ? 'Transfer Successful' : 'Transfer Blocked'}
        </h3>
        <p style={styles.resultMsg}>{result.message}</p>
        {result.verified && (
          <p style={styles.stepUpNote}>🔒 Step-up authentication verified (AFASA Article 8)</p>
        )}
        <button onClick={() => setResult(null)} style={styles.newTransferBtn}>
          New Transfer
        </button>
      </div>
    );
  }

  return (
    <div>
      {showStepUp && (
        <StepUpWidget onSuccess={handleStepUpSuccess} onCancel={handleStepUpCancel} />
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.field}>
          <label style={styles.label}>Recipient</label>
          <select
            value={recipient}
            onChange={e => setRecipient(e.target.value)}
            style={styles.select}
          >
            {RECIPIENTS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Amount</label>
          <div style={styles.amountWrap}>
            <span style={styles.currencySymbol}>₱</span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              min="1"
              step="0.01"
              style={styles.amountInput}
              required
            />
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Note (optional)</label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="What's this for?"
            style={styles.input}
            maxLength={100}
          />
        </div>

        {numAmount > 0 && numAmount <= THRESHOLD && (
          <div style={styles.previewBox}>
            <div style={styles.previewRow}>
              <span style={styles.previewKey}>To</span>
              <span style={styles.previewVal}>{recipientName}</span>
            </div>
            <div style={styles.previewRow}>
              <span style={styles.previewKey}>Amount</span>
              <span style={styles.previewVal}>₱ {numAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={styles.previewRow}>
              <span style={styles.previewKey}>Fee</span>
              <span style={styles.previewVal}>₱ 0.00</span>
            </div>
          </div>
        )}

        {needsStepUp && (
          <div style={styles.stepUpWarning}>
            <p style={styles.stepUpTitle}>🔒 Step-Up Authentication Required</p>
            <p style={styles.stepUpDesc}>
              Transfers above ₱50,000 require additional verification per AFASA Article 8.
              You will be prompted to re-authenticate before this transfer proceeds.
            </p>
          </div>
        )}

        <button type="submit" style={styles.submitBtn} disabled={!amount || numAmount <= 0}>
          {needsStepUp ? '🔒 Verify & Transfer' : 'Transfer Now'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  form: { display: 'flex', flexDirection: 'column', gap: 20 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  select: {
    padding: '11px 14px',
    border: '1.5px solid #cbd5e1',
    borderRadius: 8,
    fontSize: 15,
    color: '#1e293b',
    background: '#fff',
    outline: 'none',
  },
  amountWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  currencySymbol: {
    position: 'absolute',
    left: 14,
    fontSize: 18,
    color: '#64748b',
    fontWeight: 600,
    pointerEvents: 'none',
  },
  amountInput: {
    width: '100%',
    padding: '11px 14px 11px 32px',
    border: '1.5px solid #cbd5e1',
    borderRadius: 8,
    fontSize: 20,
    fontWeight: 700,
    color: '#0d3b8e',
    outline: 'none',
  },
  input: {
    padding: '11px 14px',
    border: '1.5px solid #cbd5e1',
    borderRadius: 8,
    fontSize: 15,
    color: '#1e293b',
    outline: 'none',
  },
  previewBox: {
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: 10,
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  previewRow: { display: 'flex', justifyContent: 'space-between' },
  previewKey: { fontSize: 13, color: '#64748b' },
  previewVal: { fontSize: 13, fontWeight: 600, color: '#1e293b' },
  stepUpWarning: {
    background: '#fef3c7',
    border: '1.5px solid #fcd34d',
    borderRadius: 10,
    padding: '14px 16px',
  },
  stepUpTitle: { fontSize: 14, fontWeight: 700, color: '#92400e', marginBottom: 6 },
  stepUpDesc: { fontSize: 13, color: '#78350f', lineHeight: 1.55 },
  submitBtn: {
    padding: '14px',
    background: 'linear-gradient(135deg, #0d3b8e, #0099cc)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    opacity: 1,
  },
  result: { textAlign: 'center', padding: '20px 0' },
  resultIcon: { fontSize: 48, marginBottom: 12 },
  resultTitle: { fontSize: 20, fontWeight: 700, marginBottom: 8 },
  resultMsg: { fontSize: 15, color: '#64748b', marginBottom: 12, lineHeight: 1.5 },
  stepUpNote: { fontSize: 13, color: '#0099cc', background: '#e0f2fe', padding: '8px 14px', borderRadius: 8, display: 'inline-block', marginBottom: 20 },
  newTransferBtn: {
    padding: '10px 28px',
    background: '#0d3b8e',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 700,
  },
};
