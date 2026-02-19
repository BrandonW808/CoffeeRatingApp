// src/components/common/UserAvatar.jsx
import React from 'react';

const UserAvatar = ({ user, size = 'medium', className = '' }) => {
    const sizeClasses = {
        small: 'avatar-sm',
        medium: 'avatar-md',
        large: 'avatar-lg',
        xlarge: 'avatar-xl',
    };

    const sizeClass = sizeClasses[size] || sizeClasses.medium;
    const avatarUrl = user?.avatar?.thumbnailUrl || user?.avatar?.url;
    const initial = (user?.username || '?').charAt(0).toUpperCase();

    if (avatarUrl) {
        return (
            <div className={`user-avatar ${sizeClass} ${className}`}>
                <img
                    src={avatarUrl}
                    alt={user?.username || 'User'}
                    className="avatar-image"
                    onError={(e) => {
                        // Fallback to initial on load error
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                    }}
                />
                <span className="avatar-fallback" style={{ display: 'none' }}>
                    {initial}
                </span>
            </div>
        );
    }

    return (
        <div className={`user-avatar ${sizeClass} ${className}`}>
            <span className="avatar-fallback">{initial}</span>
        </div>
    );
};

export default UserAvatar;