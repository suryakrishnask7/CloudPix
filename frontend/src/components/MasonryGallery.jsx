import React from 'react';
import PhotoCard from './PhotoCard.jsx';

export default function MasonryGallery({
  photos,
  favorites,
  onToggleFavorite,
  onSelectPhoto,
  onSharePhoto,
  onDeletePhoto,
}) {
  return (
    <div className="masonry-container">
      <div className="masonry-grid">
        {photos.map((photo) => (
          <PhotoCard
            key={photo.key}
            photo={photo}
            isFavorite={favorites.includes(photo.key)}
            onToggleFavorite={onToggleFavorite}
            onSelectPhoto={onSelectPhoto}
            onSharePhoto={onSharePhoto}
            onDeletePhoto={onDeletePhoto}
          />
        ))}
      </div>
    </div>
  );
}
