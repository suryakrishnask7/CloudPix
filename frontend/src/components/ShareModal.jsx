import React, { useState, useEffect } from 'react';
import { sharePhoto } from '../services/api.js';

export default function ShareModal({ photo, onClose, showToast }) {
  const [duration, setDuration] = useState(600); // 10 minutes default
  const [shareUrl, setShareUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const fetchShareUrl = async (seconds) => {
    setLoading(true);
    setError('');
    setCopied(false);
    try {
      const data = await sharePhoto(photo.key, seconds);
      setShareUrl(data.shareUrl);
      setExpiresAt(new Date(data.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Failed to generate share link:', err);
      const msg = err.data?.message || err.message || 'Could not generate share link';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (photo) {
      fetchShareUrl(duration);
    }
  }, [photo, duration]);

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      showToast('Share link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="standard-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
            <span>Share Photo</span>
          </h2>
          <button className="modal-close-icon" onClick={onClose}>
            ✕
          </button>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
          Generate a secure, temporary pre-signed Amazon S3 link to share <strong>{photo.filename}</strong> without making your bucket public.
        </p>

        {/* Expiration Selector */}
        <div className="share-options-row">
          <span>Link Expiration:</span>
          <select
            className="select-expiration"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            disabled={loading}
          >
            <option value={600}>10 Minutes</option>
            <option value={3600}>1 Hour</option>
            <option value={86400}>24 Hours</option>
            <option value={604800}>7 Days</option>
          </select>
        </div>

        {error ? (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger)',
            color: '#fca5a5',
            fontSize: '0.86rem'
          }}>
            ⚠️ {error}
          </div>
        ) : (
          <>
            <div className="share-input-group">
              <input
                type="text"
                readOnly
                value={loading ? 'Generating pre-signed URL...' : shareUrl}
                className="share-input"
                placeholder="Pre-signed S3 URL"
                onClick={(e) => e.target.select()}
              />
              <button
                className="btn-copy"
                onClick={handleCopy}
                disabled={loading || !shareUrl}
              >
                {copied ? '✓ Copied' : 'Copy Link'}
              </button>
            </div>

            {expiresAt && !loading && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                ℹ️ Link will automatically expire at {expiresAt}.
              </div>
            )}
          </>
        )}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
