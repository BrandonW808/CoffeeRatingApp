import React from 'react';
import { format } from 'date-fns';

const BrewDetails = ({ brew, onClose, onEdit }) => {
  const formatBrewTime = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} min ${secs} sec`;
  };

  const getBrewMethodEmoji = (method) => {
    const emojis = {
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
    return emojis[method] || '☕';
  };

  return (
    <div className="brew-details-modal">
      <div className="modal-header">
        <h2>Brew Details</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      <div className="brew-details-content">
        {/* Coffee Information */}
        <section className="coffee-section">
          <h3>Coffee</h3>
          <div className="coffee-info-detailed">
            <h4>{brew.coffee.name}</h4>
            <p><strong>Roaster:</strong> {brew.coffee.roaster}</p>
            <p><strong>Origin:</strong> {brew.coffee.origin}</p>
            {brew.coffee.roastDate && (
              <p><strong>Roast Date:</strong> {format(new Date(brew.coffee.roastDate), 'MMM d, yyyy')}</p>
            )}
            {brew.coffee.flavorNotes && brew.coffee.flavorNotes.length > 0 && (
              <div className="coffee-flavor-notes">
                <strong>Roaster's Notes:</strong>
                <div className="flavor-tags">
                  {brew.coffee.flavorNotes.map((note, index) => (
                    <span key={index} className="flavor-tag">{note}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Brew Parameters */}
        <section className="brew-params-section">
          <h3>Brew Parameters</h3>
          <div className="params-grid">
            <div className="param-item">
              <span className="param-icon">{getBrewMethodEmoji(brew.brewMethod)}</span>
              <span className="param-label">Method</span>
              <span className="param-value">{brew.brewMethod}</span>
            </div>
            
            <div className="param-item">
              <span className="param-icon">🌡️</span>
              <span className="param-label">Temperature</span>
              <span className="param-value">{brew.brewTemperature}°C</span>
            </div>
            
            <div className="param-item">
              <span className="param-icon">⚖️</span>
              <span className="param-label">Ratio</span>
              <span className="param-value">
                {brew.brewRatio.coffee}g : {brew.brewRatio.water}g
                <br />
                <small>(1:{(brew.brewRatio.water / brew.brewRatio.coffee).toFixed(1)})</small>
              </span>
            </div>
            
            <div className="param-item">
              <span className="param-icon">⚙️</span>
              <span className="param-label">Grind Size</span>
              <span className="param-value">{brew.grindSize}</span>
            </div>
            
            {brew.brewTime && (
              <div className="param-item">
                <span className="param-icon">⏱️</span>
                <span className="param-label">Brew Time</span>
                <span className="param-value">{formatBrewTime(brew.brewTime)}</span>
              </div>
            )}
          </div>
        </section>

        {/* Advanced Parameters */}
        {brew.extras && Object.keys(brew.extras).some(key => brew.extras[key]) && (
          <section className="advanced-params-section">
            <h3>Advanced Parameters</h3>
            <div className="advanced-params">
              {brew.extras.bloomTime && (
                <p><strong>Bloom Time:</strong> {brew.extras.bloomTime} seconds</p>
              )}
              {brew.extras.numberOfPours && (
                <p><strong>Number of Pours:</strong> {brew.extras.numberOfPours}</p>
              )}
              {brew.extras.pressure && (
                <p><strong>Pressure:</strong> {brew.extras.pressure} bars</p>
              )}
              {brew.extras.yield && (
                <p><strong>Yield:</strong> {brew.extras.yield}g</p>
              )}
              {brew.extras.waterType && (
                <p><strong>Water Type:</strong> {brew.extras.waterType}</p>
              )}
              {brew.extras.grinder && (
                <p><strong>Grinder:</strong> {brew.extras.grinder}</p>
              )}
              {brew.extras.modifications && (
                <p><strong>Modifications:</strong> {brew.extras.modifications}</p>
              )}
            </div>
          </section>
        )}

        {/* Rating and Notes */}
        <section className="rating-section">
          <h3>Rating & Notes</h3>
          <div className="rating-display">
            <span className="stars large">
              {'★'.repeat(brew.rating)}{'☆'.repeat(5 - brew.rating)}
            </span>
            <span className="rating-text">{brew.rating} out of 5</span>
          </div>
          
          {brew.flavorNotes && brew.flavorNotes.length > 0 && (
            <div className="detected-flavors">
              <strong>Detected Flavors:</strong>
              <div className="flavor-tags">
                {brew.flavorNotes.map((note, index) => (
                  <span key={index} className="flavor-tag">{note}</span>
                ))}
              </div>
            </div>
          )}
          
          {brew.notes && (
            <div className="tasting-notes">
              <strong>Tasting Notes:</strong>
              <p>{brew.notes}</p>
            </div>
          )}
        </section>

        {/* Metadata */}
        <section className="metadata-section">
          <div className="metadata">
            <p>
              <strong>Brewed by:</strong> {brew.user.username}
            </p>
            <p>
              <strong>Date:</strong> {format(new Date(brew.createdAt), 'MMMM d, yyyy h:mm a')}
            </p>
            {brew.isPublic && (
              <p className="public-indicator">
                🌍 This brew is shared publicly
              </p>
            )}
            <div className="social-stats">
              <span>❤️ {brew.likesCount || 0} likes</span>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="modal-actions">
          {onEdit && (
            <button className="btn btn-primary" onClick={onEdit}>
              Edit Brew
            </button>
          )}
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrewDetails;
