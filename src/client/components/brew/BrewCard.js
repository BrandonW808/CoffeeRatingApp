import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { toggleBrewLike } from '../../api/brew';
import { useAuth } from '../../contexts/AuthContext';
import StarRating from '../common/StarRating';

const BrewCard = ({ brew, onEdit, onDelete, onViewDetails }) => {
  const { user } = useAuth();
  const brewUser = brew.user || {};
  const brewUserId = brewUser._id || brewUser;
  const isOwner = user?._id && brewUserId && (user._id === brewUserId.toString() || user._id.toString() === brewUserId.toString());
  const safeRating = Math.max(0, Math.min(5, Math.round(brew.rating || 0)));

  const [liked, setLiked] = useState(
    Array.isArray(brew.likes) && user?._id
      ? brew.likes.some(like => {
        const likeId = typeof like === 'object' ? like._id : like;
        return likeId.toString() === user._id.toString();
      })
      : false
  );
  const [likesCount, setLikesCount] = useState(brew.likesCount || brew.likes?.length || 0);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) {
      alert('Please login to like brews');
      return;
    }

    setIsLiking(true);
    try {
      const response = await toggleBrewLike(brew._id);
      setLiked(response.liked);
      setLikesCount(response.likesCount);
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const formatBrewTime = (seconds) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getBrewMethodIcon = (method) => {
    const icons = {
      'Espresso': '☕',
      'Pour Over': '🫖',
      'V60': '🔺',
      'Chemex': '⏳',
      'French Press': '🏺',
      'Aeropress': '💉',
      'Cold Brew': '🧊',
      'Moka Pot': '🏺',
      'Kalita Wave': '〰️',
      'Siphon': '🧪',
      'Other': '☕'
    };
    return icons[method] || '☕';
  };

  return (
    <div className="brew-card" onClick={() => onViewDetails(brew)}>
      <div className="brew-header">
        <div className="brew-title">
          <span className="brew-method-icon">{getBrewMethodIcon(brew.brewMethod)}</span>
          <div>
            <h3>{brew.coffee.name}</h3>
            <p className="coffee-info">
              {brew.coffee.roaster} - {brew.coffee.origin}
            </p>
          </div>
        </div>
        {isOwner && (
          <div className="brew-actions">
            <button
              className="btn-icon"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(brew);
              }}
              title="Edit brew"
            >
              ✏️
            </button>
            <button
              className="btn-icon"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(brew._id);
              }}
              title="Delete brew"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      <div className="brew-details">
        <div className="brew-params">
          <span className="param">
            <strong>{brew.brewMethod}</strong>
          </span>
          <span className="param">
            🌡️ {brew.brewTemperature}°C
          </span>
          <span className="param">
            ⚖️ {brew.brewRatioString || `1:${(brew.brewRatio.water / brew.brewRatio.coffee).toFixed(1)}`}
          </span>
          <span className="param">
            ⚙️ {brew.grindSize}
          </span>
          {brew.brewTime && (
            <span className="param">
              ⏱️ {formatBrewTime(brew.brewTime)}
            </span>
          )}
        </div>

        <div className="brew-rating">
          <StarRating rating={brew.rating} />
          <span className="rating-number">{Math.round(brew.rating || 0)}/5</span>
        </div>

        {brew.flavorNotes && brew.flavorNotes.length > 0 && (
          <div className="flavor-notes">
            {brew.flavorNotes.slice(0, 3).map((note, index) => (
              <span key={index} className="flavor-tag small">
                {note}
              </span>
            ))}
            {brew.flavorNotes.length > 3 && (
              <span className="flavor-tag small more">
                +{brew.flavorNotes.length - 3} more
              </span>
            )}
          </div>
        )}

        {brew.notes && (
          <p className="brew-notes">
            {brew.notes.length > 150
              ? `${brew.notes.substring(0, 150)}...`
              : brew.notes}
          </p>
        )}

        <div className="brew-footer">
          <div className="brew-meta">
            {brew.isPublic && (
              <span className="public-badge" title="Shared publicly">
                🌍 Public
              </span>
            )}
            {!isOwner && brewUser.username && (
              <span className="brew-user">
                by {brewUser.username}
              </span>
            )}
            <span className="brew-date">
              {formatDistanceToNow(new Date(brew.createdAt), { addSuffix: true })}
            </span>
          </div>

          <div className="brew-social">
            <button
              className={`like-button ${liked ? 'liked' : ''}`}
              onClick={handleLike}
              disabled={isLiking}
            >
              <span className="like-icon">{liked ? '❤️' : '🤍'}</span>
              <span className="like-count">{likesCount}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrewCard;
