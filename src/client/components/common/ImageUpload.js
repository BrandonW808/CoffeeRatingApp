// src/components/common/ImageUpload.jsx
import React, { useState, useRef, useCallback } from 'react';

const ImageUpload = ({
    existingImages = [],
    onUpload,
    onDelete,
    onSetPrimary,
    maxImages = 10,
    disabled = false,
}) => {
    const [previews, setPreviews] = useState([]);   // files selected but not yet uploaded
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const remainingSlots = maxImages - existingImages.length - previews.length;

    const validateFiles = (files) => {
        const valid = [];
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

        for (const file of files) {
            if (!allowedTypes.includes(file.type)) {
                setError(`${file.name}: unsupported format`);
                continue;
            }
            if (file.size > maxSize) {
                setError(`${file.name}: exceeds 10MB limit`);
                continue;
            }
            valid.push(file);
        }

        return valid.slice(0, remainingSlots);
    };

    const addFiles = useCallback(
        (fileList) => {
            setError(null);
            const files = validateFiles(Array.from(fileList));

            const newPreviews = files.map((file) => ({
                file,
                previewUrl: URL.createObjectURL(file),
                id: `${Date.now()}-${Math.random()}`,
            }));

            setPreviews((prev) => [...prev, ...newPreviews]);
        },
        [remainingSlots]
    );

    const handleFileSelect = (e) => {
        addFiles(e.target.files);
        e.target.value = ''; // reset so same file can be re-selected
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        addFiles(e.dataTransfer.files);
    };

    const removePreview = (id) => {
        setPreviews((prev) => {
            const item = prev.find((p) => p.id === id);
            if (item) URL.revokeObjectURL(item.previewUrl);
            return prev.filter((p) => p.id !== id);
        });
    };

    const handleUpload = async () => {
        if (previews.length === 0) return;

        setUploading(true);
        setError(null);

        try {
            const files = previews.map((p) => p.file);
            await onUpload(files);

            // Clean up preview URLs
            previews.forEach((p) => URL.revokeObjectURL(p.previewUrl));
            setPreviews([]);
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="image-upload">
            {/* ── Existing Images ─────────────────── */}
            {existingImages.length > 0 && (
                <div className="existing-images">
                    {existingImages.map((img) => (
                        <div
                            key={img._id}
                            className={`image-thumb ${img.isPrimary ? 'primary' : ''}`}
                        >
                            <img src={img.thumbnailUrl} alt="Coffee" loading="lazy" />
                            <div className="image-overlay">
                                {!img.isPrimary && onSetPrimary && (
                                    <button
                                        type="button"
                                        onClick={() => onSetPrimary(img._id)}
                                        title="Set as primary"
                                        className="btn-icon"
                                    >
                                        ⭐
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        type="button"
                                        onClick={() => onDelete(img._id)}
                                        title="Delete image"
                                        className="btn-icon btn-icon-danger"
                                    >
                                        🗑️
                                    </button>
                                )}
                            </div>
                            {img.isPrimary && <span className="primary-badge">Primary</span>}
                        </div>
                    ))}
                </div>
            )}

            {/* ── Drop Zone ───────────────────────── */}
            {remainingSlots > 0 && !disabled && (
                <div
                    className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/heic"
                        multiple
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                    <div className="drop-zone-content">
                        <span className="drop-icon">📷</span>
                        <p>Drag &amp; drop images here or click to browse</p>
                        <p className="drop-hint">
                            {remainingSlots} slot{remainingSlots !== 1 ? 's' : ''} remaining
                            &middot; Max 10MB per image
                        </p>
                    </div>
                </div>
            )}

            {/* ── Staged Previews ─────────────────── */}
            {previews.length > 0 && (
                <div className="staged-previews">
                    <div className="preview-grid">
                        {previews.map((p) => (
                            <div key={p.id} className="preview-thumb">
                                <img src={p.previewUrl} alt="Preview" />
                                <button
                                    type="button"
                                    onClick={() => removePreview(p.id)}
                                    className="btn-remove-preview"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={handleUpload}
                        disabled={uploading}
                        className="btn btn-primary"
                    >
                        {uploading
                            ? 'Uploading...'
                            : `Upload ${previews.length} image${previews.length !== 1 ? 's' : ''}`}
                    </button>
                </div>
            )}

            {error && <div className="image-upload-error">{error}</div>}
        </div>
    );
};

export default ImageUpload;