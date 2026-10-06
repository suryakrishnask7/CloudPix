import React, { useState } from 'react';

export default function ConfirmModal({ title, message, onConfirm, onCancel, confirmText = 'Delete', isDanger = true }) {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel} role="dialog" aria-modal="true">
      <div className="standard-modal-box" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ color: isDanger ? '#ef4444' : 'inherit' }}>
            {isDanger && (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            )}
            <span>{title}</span>
          </h2>
          <button className="modal-close-icon" onClick={onCancel} disabled={submitting}>
            ✕
          </button>
        </div>

        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '8px 0 20px' }}>
          {message}
        </p>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button
            className={isDanger ? 'btn-danger' : 'btn-primary'}
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? 'Deleting...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
