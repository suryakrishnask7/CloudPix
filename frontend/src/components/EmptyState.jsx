import React from 'react';

export default function EmptyState({ type = 'empty', searchQuery = '', onUploadClick, onClearSearch }) {
  if (type === 'search') {
    return (
      <div className="empty-state-card">
        <div className="empty-state-icon-wrap">🔍</div>
        <h3 className="empty-state-title">No photos found</h3>
        <p className="empty-state-desc">
          No photos matched your search for <strong>"{searchQuery}"</strong>. Try a different filename or keyword.
        </p>
        <button className="btn-secondary" onClick={onClearSearch}>
          Clear search
        </button>
      </div>
    );
  }

  if (type === 'favorites') {
    return (
      <div className="empty-state-card">
        <div className="empty-state-icon-wrap">💖</div>
        <h3 className="empty-state-title">No favorites yet</h3>
        <p className="empty-state-desc">
          Click the heart icon on any photo in your gallery to keep your favorite memories close.
        </p>
      </div>
    );
  }


  // Default empty gallery state
  return (
    <div className="empty-state-card">
      <div className="empty-state-icon-wrap">☁️</div>
      <h3 className="empty-state-title">Your cloud gallery is empty</h3>
      <p className="empty-state-desc">
        Upload your first photo to get started.
      </p>
      <button className="btn-primary" onClick={onUploadClick}>
        + Upload Photos
      </button>
    </div>
  );
}
