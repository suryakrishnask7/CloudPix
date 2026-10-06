import React, { useState } from 'react';

// Format bytes into human-readable size
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export default function PhotoCard({
  photo,
  isFavorite,
  onToggleFavorite,
  onSelectPhoto,
  onSharePhoto,
  onDeletePhoto,
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleCardClick = () => {
    onSelectPhoto(photo);
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    onToggleFavorite(photo.key);
  };

  const handleShareClick = (e) => {
    e.stopPropagation();
    onSharePhoto(photo);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDeletePhoto(photo);
  };

  return (
    <div className="photo-card-wrapper">
      <div className="photo-card" onClick={handleCardClick} role="button" tabIndex={0}>
        <div className="photo-image-container">
          {!imageLoaded && !hasError && <div className="skeleton-shimmer" />}

          {hasError ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: '#94a3b8' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto 8px' }}>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <div style={{ fontSize: '0.8rem' }}>Failed to load image</div>
            </div>
          ) : (
            <img
              src={photo.url}
              alt={photo.filename}
              loading="lazy"
              className={`photo-img ${imageLoaded ? 'loaded' : 'loading'}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setHasError(true)}
            />
          )}

          {/* Hover Overlay Controls */}
          <div className="card-hover-overlay">
            <div className="card-top-actions">
              <button
                className={`card-action-btn favorite-btn ${isFavorite ? 'favorited' : ''}`}
                onClick={handleFavoriteClick}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                aria-label="Favorite"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="card-action-btn share-btn"
                  onClick={handleShareClick}
                  title="Generate share link"
                  aria-label="Share"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                </button>

                <button
                  className="card-action-btn delete-btn"
                  onClick={handleDeleteClick}
                  title="Delete from S3"
                  aria-label="Delete"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>

            <div className="card-bottom-info">
              <span className="card-filename" title={photo.filename}>
                {photo.filename}
              </span>
              <span className="card-meta">
                {formatFileSize(photo.size)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
