import React from 'react';

export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast ${toast.type || 'info'}`}
          onClick={() => onDismiss(toast.id)}
        >
          <span>
            {toast.type === 'success' && '✓'}
            {toast.type === 'error' && '⚠️'}
            {toast.type === 'info' && 'ℹ️'}
          </span>
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button
            style={{ fontSize: '12px', opacity: 0.7, padding: '2px 4px' }}
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(toast.id);
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
