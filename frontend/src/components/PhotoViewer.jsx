import React, { useEffect } from 'react';

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function PhotoViewer({
  photo,
  photos,
  isFavorite,
  onClose,
  onToggleFavorite,
  onSharePhoto,
  onDeletePhoto,
  onSelectPhoto,
}) {
  const currentIndex = photos.findIndex((p) => p.key === photo.key);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  const handlePrev = (e) => {
    e?.stopPropagation();
    if (hasPrev) onSelectPhoto(photos[currentIndex - 1]);
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    if (hasNext) onSelectPhoto(photos[currentIndex + 1]);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) handlePrev();
      if (e.key === 'ArrowRight' && hasNext) handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasPrev, hasNext, currentIndex, photos]);

  // Handle direct download
  const handleDownload = async () => {
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = photo.filename || 'photo';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // Fallback: open in new tab
      window.open(photo.url, '_blank');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="viewer-wrapper" onClick={(e) => e.stopPropagation()}>
        {/* Top bar */}
        <div className="viewer-topbar">
          <div className="viewer-photo-info">
            <span className="viewer-filename" title={photo.filename}>
              {photo.filename}
            </span>
            {photo.lastModified && (
              <span className="viewer-date">• {formatDate(photo.lastModified)}</span>
            )}
            {photo.size && (
              <span className="viewer-date">({formatFileSize(photo.size)})</span>
            )}
          </div>

          <button className="viewer-close-btn" onClick={onClose} title="Close (Esc)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Center stage */}
        <div className="viewer-stage">
          {hasPrev && (
            <button className="viewer-nav-btn prev" onClick={handlePrev} title="Previous photo (←)">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
          )}

          <div className="viewer-img-container">
            <img
              src={photo.url}
              alt={photo.filename}
              className="viewer-img"
            />
          </div>

          {hasNext && (
            <button className="viewer-nav-btn next" onClick={handleNext} title="Next photo (→)">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          )}
        </div>

        {/* Bottom floating toolbar */}
        <div className="viewer-bottombar">
          <div className="viewer-toolbar-pill">
            <button
              className={`viewer-tool-btn ${isFavorite ? 'favorited' : ''}`}
              onClick={() => onToggleFavorite(photo.key)}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill={isFavorite ? '#f43f5e' : 'none'}>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span>{isFavorite ? 'Favorited' : 'Favorite'}</span>
            </button>

            <div className="viewer-tool-separator" />

            <button className="viewer-tool-btn" onClick={handleDownload} title="Download photo to your computer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Download</span>
            </button>

            <button className="viewer-tool-btn" onClick={() => onSharePhoto(photo)} title="Generate temporary share link">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
              <span>Share</span>
            </button>

            <div className="viewer-tool-separator" />

            <button
              className="viewer-tool-btn delete-btn"
              onClick={() => onDeletePhoto(photo)}
              title="Delete photo permanently from S3"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
