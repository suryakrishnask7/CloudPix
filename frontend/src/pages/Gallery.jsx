import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from '../components/Header.jsx';
import MasonryGallery from '../components/MasonryGallery.jsx';
import PhotoViewer from '../components/PhotoViewer.jsx';
import UploadModal from '../components/UploadModal.jsx';
import ShareModal from '../components/ShareModal.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import EmptyState from '../components/EmptyState.jsx';
import StatusModal from '../components/StatusModal.jsx';
import Toast from '../components/Toast.jsx';
import { getPhotos, deletePhoto, checkBackendHealth } from '../services/api.js';

// Local storage key for persistent favorites
const FAVORITES_STORAGE_KEY = 'cloudpix_favorites_v1';

export default function Gallery() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [backendHealth, setBackendHealth] = useState(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Search & Navigation
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Modals & Active Photo State
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [sharePhotoTarget, setSharePhotoTarget] = useState(null);
  const [deletePhotoTarget, setDeletePhotoTarget] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState([]);

  // Favorites in LocalStorage
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Toggle favorite status
  const handleToggleFavorite = useCallback((photoKey) => {
    setFavorites((prev) => {
      let updated;
      if (prev.includes(photoKey)) {
        updated = prev.filter((k) => k !== photoKey);
        showToast('Removed from favorites', 'info');
      } else {
        updated = [...prev, photoKey];
        showToast('Added to favorites!', 'success');
      }
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save favorites to localStorage:', e);
      }
      return updated;
    });
  }, [showToast]);

  // Check health and load photos
  const fetchHealthAndPhotos = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    // Check health
    const health = await checkBackendHealth();
    setBackendHealth(health);

    try {
      const data = await getPhotos();
      setPhotos(data.photos || []);
    } catch (err) {
      console.warn('Could not load photos from S3:', err);
      setError({
        message: err.data?.message || err.message || 'Failed to retrieve photos from AWS S3',
        status: err.status,
        isConfigured: err.data?.isConfigured ?? true,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHealthAndPhotos();
  }, [fetchHealthAndPhotos]);

  // Handle photo deletion
  const handleConfirmDelete = async () => {
    if (!deletePhotoTarget) return;
    try {
      await deletePhoto(deletePhotoTarget.key);
      setPhotos((prev) => prev.filter((p) => p.key !== deletePhotoTarget.key));
      // Remove from favorites if favorited
      setFavorites((prev) => prev.filter((k) => k !== deletePhotoTarget.key));
      if (selectedPhoto?.key === deletePhotoTarget.key) {
        setSelectedPhoto(null);
      }
      showToast('Photo deleted from AWS S3 successfully', 'success');
      setDeletePhotoTarget(null);
    } catch (err) {
      console.error('Failed to delete photo:', err);
      showToast(err.data?.message || 'Failed to delete photo from S3', 'error');
    }
  };

  // Filter photos based on search and tab
  const filteredPhotos = useMemo(() => {
    let list = [...photos];

    // Tab filter
    if (activeTab === 'favorites') {
      list = list.filter((p) => favorites.includes(p.key));
    }

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      list = list.filter((p) => p.filename.toLowerCase().includes(query));
    }

    return list;
  }, [photos, activeTab, searchQuery, favorites]);

  // S3 connection indicator status
  const backendStatusClass = useMemo(() => {
    if (!backendHealth || backendHealth.status === 'offline') return 'offline';
    if (backendHealth.s3?.status === 'healthy') return 'healthy';
    if (backendHealth.s3?.status === 'unconfigured') return 'unconfigured';
    return 'offline';
  }, [backendHealth]);

  const showS3Notice = !bannerDismissed && (
    error?.status === 503 ||
    backendHealth?.s3?.status === 'unconfigured' ||
    backendHealth?.status === 'offline'
  );

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        favoritesCount={favorites.length}
        photosCount={photos.length}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenStatus={() => setIsStatusOpen(true)}
        backendStatus={backendStatusClass}
      />

      <main className="main-content">
        {/* S3 Configuration Notice Banner if unconfigured or offline */}
        {showS3Notice && (
          <div className="config-banner">
            <div className="banner-info">
              <span className="banner-icon">☁️</span>
              <div>
                <h4 className="banner-title">
                  {backendHealth?.status === 'offline'
                    ? 'Backend Server Offline'
                    : 'AWS S3 Bucket Configuration Notice'}
                </h4>
                <p className="banner-desc">
                  {backendHealth?.status === 'offline'
                    ? 'The Node.js backend is currently unreachable at http://localhost:5000. Start it with "npm run dev:backend".'
                    : 'To view and upload live photos, configure your AWS S3 credentials (AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME) in backend/.env.'}
                </p>
              </div>
            </div>
            <div className="banner-actions">
              <button className="btn-banner-link" onClick={() => setIsStatusOpen(true)}>
                View Settings
              </button>
              <button
                className="btn-banner-close"
                onClick={() => setBannerDismissed(true)}
                title="Dismiss notice"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Gallery Sub-toolbar */}
        <div className="gallery-toolbar">
          <div className="gallery-title-wrap">
            <h1 className="gallery-title">
              {activeTab === 'all' && (searchQuery ? `Search Results` : `All Photos`)}
              {activeTab === 'favorites' && `Favorites`}
            </h1>
            <span className="gallery-count">
              {photos.length > 0 && `${filteredPhotos.length} photo${filteredPhotos.length === 1 ? '' : 's'}`}
            </span>
          </div>

          <button
            className={`gallery-refresh-btn ${refreshing ? 'spinning' : ''}`}
            onClick={() => fetchHealthAndPhotos(true)}
            title="Refresh gallery from AWS S3"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
            </svg>
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        {/* Loading Spinner / Skeleton */}
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
            </svg>
            <div style={{ fontSize: '1rem', fontWeight: 500 }}>Connecting to AWS S3...</div>
          </div>
        ) : (
          <>
            {filteredPhotos.length === 0 ? (
              /* Empty States */
              <EmptyState
                type={
                  searchQuery.trim()
                    ? 'search'
                    : activeTab === 'favorites'
                    ? 'favorites'
                    : 'empty'
                }
                searchQuery={searchQuery}
                onUploadClick={() => setIsUploadOpen(true)}
                onClearSearch={() => setSearchQuery('')}
              />
            ) : (
              /* Pinterest-style Masonry Gallery */
              <MasonryGallery
                photos={filteredPhotos}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onSelectPhoto={(photo) => setSelectedPhoto(photo)}
                onSharePhoto={(photo) => setSharePhotoTarget(photo)}
                onDeletePhoto={(photo) => setDeletePhotoTarget(photo)}
              />
            )}
          </>
        )}
      </main>

      {/* Lightbox / Photo Viewer Modal */}
      {selectedPhoto && (
        <PhotoViewer
          photo={selectedPhoto}
          photos={filteredPhotos}
          isFavorite={favorites.includes(selectedPhoto.key)}
          onClose={() => setSelectedPhoto(null)}
          onToggleFavorite={handleToggleFavorite}
          onSharePhoto={(photo) => setSharePhotoTarget(photo)}
          onDeletePhoto={(photo) => setDeletePhotoTarget(photo)}
          onSelectPhoto={(photo) => setSelectedPhoto(photo)}
        />
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <UploadModal
          onClose={() => setIsUploadOpen(false)}
          onUploadSuccess={() => fetchHealthAndPhotos(true)}
          showToast={showToast}
        />
      )}

      {/* Share Modal */}
      {sharePhotoTarget && (
        <ShareModal
          photo={sharePhotoTarget}
          onClose={() => setSharePhotoTarget(null)}
          showToast={showToast}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletePhotoTarget && (
        <ConfirmModal
          title="Delete Photo"
          message={`Are you sure you want to permanently delete "${deletePhotoTarget.filename}" from Amazon S3? This action cannot be undone.`}
          confirmText="Delete from S3"
          isDanger={true}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletePhotoTarget(null)}
        />
      )}

      {/* Cloud & S3 Status Modal */}
      {isStatusOpen && (
        <StatusModal
          health={backendHealth}
          onClose={() => setIsStatusOpen(false)}
          onRefreshHealth={() => fetchHealthAndPhotos(true)}
        />
      )}

      {/* Toasts */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
