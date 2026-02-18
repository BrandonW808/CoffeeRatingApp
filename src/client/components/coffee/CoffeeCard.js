// src/components/coffee/CoffeeCard.jsx
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
  const [editData, setEditData] = useState({
    ...coffee,
    roastDate: coffee.roastDate ? coffee.roastDate.split('T')[0] : '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [saveError, setSaveError] = useState(null);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString();

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

  // Image handlers - only called from edit mode
  const handleImageUpload = async (files) => {
    await uploadCoffeeImages(coffee._id, files);
    if (onRefresh) onRefresh();
  };

  const handleImageDelete = async (imageId) => {
    if (window.confirm('Delete this image?')) {
      await deleteCoffeeImage(coffee._id, imageId);
      // Reset carousel index if needed
      if (currentImageIndex >= images.length - 1) {
        setCurrentImageIndex(Math.max(0, images.length - 2));
      }
      if (onRefresh) onRefresh();
    }
  };

  const handleSetPrimary = async (imageId) => {
    await setPrimaryImage(coffee._id, imageId);
    if (onRefresh) onRefresh();
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await onUpdate(coffee._id, {
        ...editData,
        price: editData.price ? parseFloat(editData.price) : undefined,
        rating: editData.rating ? parseInt(editData.rating) : undefined,
        isPublic: editData.isPublic === 'true' || editData.isPublic === true,
      });
      setIsEditing(false);
    } catch (error) {
      setSaveError(error.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset edit data to current coffee values
    setEditData({
      ...coffee,
      roastDate: coffee.roastDate ? coffee.roastDate.split('T')[0] : '',
    });
    setSaveError(null);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="coffee-card editing">
        <h3 className="edit-title">Edit Coffee</h3>

        {saveError && (
          <div className="error-message">{saveError}</div>
        )}

        {/* ── Edit Fields ── */}
        <div className="edit-fields">
          <div className="form-group">
            <label>Coffee Name*</label>
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              placeholder="Coffee name"
            />
          </div>

          <div className="form-group">
            <label>Roaster*</label>
            <input
              type="text"
              value={editData.roaster}
              onChange={(e) => setEditData({ ...editData, roaster: e.target.value })}
              placeholder="Roaster"
            />
          </div>

          <div className="form-group">
            <label>Origin*</label>
            <input
              type="text"
              value={editData.origin}
              onChange={(e) => setEditData({ ...editData, origin: e.target.value })}
              placeholder="Origin"
            />
          </div>

          <div className="form-group">
            <label>Roast Date*</label>
            <input
              type="date"
              value={editData.roastDate}
              onChange={(e) => setEditData({ ...editData, roastDate: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Public</label>
            <select
              value={String(editData.isPublic)}
              onChange={(e) => setEditData({ ...editData, isPublic: e.target.value })}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          <div className="form-group">
            <label>Rating (1–5)</label>
            <div className="rating-input">
              <input
                type="range"
                min="1"
                max="5"
                value={editData.rating || 3}
                onChange={(e) => setEditData({ ...editData, rating: parseInt(e.target.value) })}
              />
              <span className="rating-display">
                {'★'.repeat(editData.rating || 3)}
                {'☆'.repeat(5 - (editData.rating || 3))}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label>Price</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={editData.price || ''}
              onChange={(e) => setEditData({ ...editData, price: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div className="form-group">
            <label>Tasting Notes</label>
            <textarea
              value={editData.notes || ''}
              onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
              placeholder="Tasting notes"
              rows="3"
            />
          </div>
        </div>

        {/* ── Image Manager (edit mode only) ── */}
        <div className="edit-section">
          <h4>Photos ({images.length}/10)</h4>
          <ImageUpload
            existingImages={images}
            onUpload={handleImageUpload}
            onDelete={handleImageDelete}
            onSetPrimary={handleSetPrimary}
            maxImages={10}
          />
        </div>

        <div className="card-actions">
          <button
            onClick={handleSave}
            className="btn btn-save"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={handleCancelEdit}
            className="btn btn-cancel"
            disabled={isSaving}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── View Mode ──────────────────────────────────────────
  return (
    <div className="coffee-card">
      {/* Image Section */}
      <div className="card-image-section">
        {hasImages ? (
          <div className="image-carousel">
            <img
              src={images[currentImageIndex].url}
              alt={coffee.name}
              className="card-hero-image"
              loading="lazy"
              onError={(e) => {
                // Fallback if image fails to load
                e.target.style.display = 'none';
                e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
              }}
            />
            {/* Hidden fallback */}
            <div className="card-image-placeholder" style={{ display: 'none' }}>
              <span>☕</span>
              <p>Image unavailable</p>
            </div>

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

      {/* Card Content */}
      <div className="card-header">
        <h3>{coffee.name}</h3>
        <StarRating rating={coffee.userAvgRating || coffee.rating} max={5} />
      </div>

      <div className="card-body">
        <p><strong>Roaster:</strong> {coffee.roaster}</p>
        <p><strong>Origin:</strong> {coffee.origin}</p>
        <p><strong>Roast Date:</strong> {formatDate(coffee.roastDate)}</p>
        <p><strong>Public:</strong> {coffee.isPublic ? 'Yes' : 'No'}</p>
        {coffee.price != null && (
          <p><strong>Price:</strong> ${Number(coffee.price).toFixed(2)}</p>
        )}
        {coffee.notes && (
          <p><strong>Notes:</strong> {coffee.notes}</p>
        )}
        {coffee.userBrewCount > 0 && (
          <p><strong>Your Brews:</strong> {coffee.userBrewCount}</p>
        )}
      </div>

      <div className="card-footer">
        <span className="image-count">📷 {images.length}</span>
        <button onClick={() => setIsEditing(true)} className="btn btn-edit">
          Edit
        </button>
        <button onClick={() => onDelete(coffee._id)} className="btn btn-delete">
          Delete
        </button>
      </div>
    </div>
  );
};

export default CoffeeCard;