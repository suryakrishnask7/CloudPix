import React, { useState } from 'react';
import { checkBackendHealth } from '../services/api.js';

export default function StatusModal({ health, onClose, onRefreshHealth }) {
  const [checking, setChecking] = useState(false);

  const handleTestConnection = async () => {
    setChecking(true);
    await onRefreshHealth();
    setTimeout(() => setChecking(false), 400);
  };

  const s3Status = health?.s3?.status || 'offline';
  const isHealthy = s3Status === 'healthy';

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="standard-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"></path>
            </svg>
            <span>Cloud & S3 Status</span>
          </h2>
          <button className="modal-close-icon" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="status-details-grid">
          <div className="status-item">
            <span className="status-label">Backend Service</span>
            <span className="status-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className={`status-dot ${health?.status === 'ok' ? 'healthy' : 'offline'}`} style={{ position: 'static' }} />
              {health?.status === 'ok' ? 'Online (Express :5000)' : 'Offline'}
            </span>
          </div>

          <div className="status-item">
            <span className="status-label">AWS S3 Storage</span>
            <span className={`status-badge ${s3Status}`}>
              {s3Status === 'healthy' && 'Connected'}
              {s3Status === 'unconfigured' && 'Not Configured'}
              {s3Status === 'offline' && 'Unavailable'}
              {s3Status === 'error' && 'Connection Error'}
            </span>
          </div>

          <div className="status-item">
            <span className="status-label">S3 Bucket</span>
            <span className="status-value">{health?.s3?.bucket || 'None specified'}</span>
          </div>

          <div className="status-item">
            <span className="status-label">AWS Region</span>
            <span className="status-value">{health?.s3?.region || 'us-east-1'}</span>
          </div>
        </div>

        {!isHealthy && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px',
            fontSize: '0.84rem',
            lineHeight: 1.5,
            color: '#fef3c7',
            marginBottom: '16px'
          }}>
            <strong style={{ display: 'block', marginBottom: '4px' }}>💡 How to connect AWS S3:</strong>
            1. Open <code>backend/.env</code> in your editor.<br />
            2. Set your <code>AWS_REGION</code>, <code>AWS_ACCESS_KEY_ID</code>, <code>AWS_SECRET_ACCESS_KEY</code>, and <code>S3_BUCKET_NAME</code>.<br />
            3. Ensure your S3 bucket has CORS enabled and correct IAM permissions.<br />
            4. Click "Test Connection" below to verify.
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={handleTestConnection} disabled={checking}>
            {checking ? 'Testing...' : 'Test Connection'}
          </button>
          <button className="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
