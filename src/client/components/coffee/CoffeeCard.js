import React, { useState } from 'react';
import StarRating from '../common/StarRating';
import ImageUpload from '../common/ImageUpload';
import {
  uploadCoffeeImages,
  deleteCoffeeImage,
  setPrimaryImage,
} from '../../api/coffee';

const CoffeeCard = ({ coffee, onUpdate, onDelete, onRefresh }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showImageManager, setShowImageManager] = useState(false);
  const [editData, setEditData] = useState(coffee);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString();

  // ── Image carousel navigation ──
  const images = coffee.images || [];
  const hasImages = images.length > 0;

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((i) => (i + 1) % images.length);
  };
  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((i) => (i - 1 + images.length) % images.length);
  };

  // ── Image management handlers ──
  const handleImageUpload = async (files) => {
    await uploadCoffeeImages(coffee._id, files);
    if (onRefresh) onRefresh(); // re-fetch from parent
  };

  const handleImageDelete = async (imageId) => {
    if (window.confirm('Delete this image?')) {
      await deleteCoffeeImage(coffee._id, imageId);
      if (onRefresh) onRefresh();
    }
  };

  const handleSetPrimary = async (imageId) => {
    await setPrimaryImage(coffee._id, imageId);
    if (onRefresh) onRefresh();
  };

  const handleSave = async () => {
    try {
      await onUpdate(coffee._id, editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update coffee:', error);
    }
  };

  if (isEditing) {
    return (
      <div className="coffee-card editing">
        <input
          type="text"
          value={editData.name}
          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
          placeholder="Coffee name"
        />
        <input
          type="text"
          value={editData.roaster}
          onChange={(e) => setEditData({ ...editData, roaster: e.target.value })}
          placeholder="Roaster"
        />
        <input
          type="text"
          value={editData.origin}
          onChange={(e) => setEditData({ ...editData, origin: e.target.value })}
          placeholder="Origin"
        />
        <input
          type="date"
          value={editData.roastDate.split('T')[0]}
          onChange={(e) => setEditData({ ...editData, roastDate: e.target.value })}
        />
        <select
          value={editData.isPublic}
          onChange={(e) => setEditData({ ...editData, isPublic: e.target.value })}
        >
          <option value={true}>Yes</option>
          <option value={false}>No</option>
        </select>
        <input
          type="number"
          min="1"
          max="5"
          value={editData.rating}
          onChange={(e) => setEditData({ ...editData, rating: parseInt(e.target.value) })}
          placeholder="Rating"
        />
        <textarea
          value={editData.notes || ''}
          onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
          placeholder="Tasting notes"
        />
        <input
          type="number"
          step="0.01"
          value={editData.price || ''}
          onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) })}
          placeholder="Price"
        />
        <div className="card-actions">
          <button onClick={handleSave} className="btn btn-save">Save</button>
          <button onClick={() => setIsEditing(false)} className="btn btn-cancel">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="coffee-card">
      {/* ── Image Section ──────────────────── */}
      <div className="card-image-section">
        {hasImages ? (
          <div className="image-carousel">
            <img
              src={images[currentImageIndex].url}
              alt={coffee.name}
              className="card-hero-image"
              loading="lazy"
            />
            {images.length > 1 && (
              <>
                <button className="carousel-btn prev" onClick={prevImage}>
                  ‹
                </button>
                <button className="carousel-btn next" onClick={nextImage}>
                  ›
                </button>
                <div className="carousel-dots">
                  {images.map((_, i) => (
                    <span
                      key={i}
                      className={`dot ${i === currentImageIndex ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(i);
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="card-image-placeholder">
            <span>☕</span>
            <p>No photos yet</p>
          </div>
        )}
      </div>

      {/* ── Card Content ───────────────────── */}
      <div className="card-header">
        <h3>{coffee.name}</h3>
        <StarRating rating={coffee.userAvgRating || coffee.rating} max={10} />
      </div>

      <div className="card-body">
        <p><strong>Roaster:</strong> {coffee.roaster}</p>
        <p><strong>Origin:</strong> {coffee.origin}</p>
        <p><strong>Roast Date:</strong> {formatDate(coffee.roastDate)}</p>
        <p><strong>Public:</strong> {coffee.isPublic ? 'Yes' : 'No'}</p>
        {coffee.price && (
          <p><strong>Price:</strong> ${coffee.price.toFixed(2)}</p>
        )}
      </div>

      <div className="card-footer">
        <button
          onClick={() => setShowImageManager(!showImageManager)}
          className="btn btn-secondary"
        >
          📷 {images.length}
        </button>
        <button onClick={() => setIsEditing(true)} className="btn btn-edit">
          Edit
        </button>
        <button onClick={() => onDelete(coffee._id)} className="btn btn-delete">
          Delete
        </button>
      </div>

      {/* ── Image Manager (expandable) ───── */}
      {showImageManager && (
        <div className="card-image-manager">
          <ImageUpload
            existingImages={images}
            onUpload={handleImageUpload}
            onDelete={handleImageDelete}
            onSetPrimary={handleSetPrimary}
            maxImages={10}
          />
        </div>
      )}
    </div>
  );
};

export default CoffeeCard;
