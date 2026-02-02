// components/common/StarRating.jsx
import React from 'react';

const StarRating = ({ rating, max = 5, size = 'normal' }) => {
    const safeRating = Math.max(0, Math.min(max, Math.round(rating || 0)));

    return (
        <span className={`stars ${size}`} aria-label={`${safeRating} out of ${max} stars`}>
            {'★'.repeat(safeRating)}
            {'☆'.repeat(max - safeRating)}
        </span>
    );
};

export default StarRating;