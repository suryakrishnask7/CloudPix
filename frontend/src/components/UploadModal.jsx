import React, { useState, useRef } from 'react';
import { uploadPhotos } from '../services/api.js';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export default function UploadModal({ onClose, onUploadSuccess, showToast }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  // Validate and stage files
  const handleFiles = (files) => {
    setErrorMessage('');
    const validFiles = [];
    const errors = [];

    Array.from(files).forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
        errors.push(`"${file.name}" is not a valid format. Only JPG, PNG, and WEBP are supported.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`"${file.name}" exceeds the 20MB limit (${formatBytes(file.size)}).`);
        return;
      }

      // Avoid duplicates in current selection
      const exists = selectedFiles.some(
        (f) => f.file.name === file.name && f.file.size === file.size
      );
      if (!exists) {
        validFiles.push({
          file,
          previewUrl: URL.createObjectURL(file),
        });
      }
    });

    if (errors.length > 0) {
      setErrorMessage(errors[0]);
    }

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].previewUrl);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleSubmitUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setProgress(0);
    setErrorMessage('');

    try {
      const rawFiles = selectedFiles.map((item) => item.file);
      const res = await uploadPhotos(rawFiles, (pct) => {
        setProgress(pct);
      });

      // Cleanup preview URLs
      selectedFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));

      showToast(`Successfully uploaded ${res.count} photo${res.count > 1 ? 's' : ''} to AWS S3!`, 'success');
      onUploadSuccess();
      onClose();
    } catch (err) {
      console.error('Upload failed:', err);
      const msg = err.data?.message || err.message || 'Failed to upload photos to S3';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="standard-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <span>Upload Photos to S3</span>
          </h2>
          <button className="modal-close-icon" onClick={onClose} disabled={uploading}>
            ✕
          </button>
        </div>

        {/* Dropzone */}
        <div
          className={`dropzone-area ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp"
            style={{ display: 'none' }}
            onChange={handleFileInputChange}
            disabled={uploading}
          />
          <div className="dropzone-icon">☁️</div>
          <div className="dropzone-text">Click or drag & drop photos here</div>
          <div className="dropzone-subtext">Supports JPG, PNG, WEBP up to 20MB each</div>
        </div>

        {/* Validation or Error Alert */}
        {errorMessage && (
          <div style={{
            marginTop: '14px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger)',
            color: '#fca5a5',
            fontSize: '0.85rem'
          }}>
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Selected files preview */}
        {selectedFiles.length > 0 && (
          <div className="files-preview-list">
            {selectedFiles.map((item, idx) => (
              <div key={idx} className="file-preview-item">
                <div className="file-preview-left">
                  <img src={item.previewUrl} alt={item.file.name} className="file-thumb" />
                  <div className="file-name-meta">
                    <span className="file-item-name" title={item.file.name}>
                      {item.file.name}
                    </span>
                    <span className="file-item-size">{formatBytes(item.file.size)}</span>
                  </div>
                </div>

                {!uploading && (
                  <button
                    className="file-remove-btn"
                    onClick={() => handleRemoveFile(idx)}
                    title="Remove from queue"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Progress Bar during upload */}
        {uploading && (
          <div className="upload-progress-wrapper">
            <div className="progress-meta">
              <span>Uploading to Amazon S3...</span>
              <span>{progress}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose} disabled={uploading}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSubmitUpload}
            disabled={uploading || selectedFiles.length === 0}
          >
            {uploading ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                </svg>
                <span>Uploading ({progress}%)...</span>
              </>
            ) : (
              <span>Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
