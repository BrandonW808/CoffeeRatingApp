// src/components/brew/AddBrewForm.jsx
import React, { useState, useEffect } from 'react';
import { searchCoffees } from '../../api/coffee';

const AddBrewForm = ({ onSubmit, onCancel, selectedCoffee = null }) => {
  const [formData, setFormData] = useState({
    coffee: selectedCoffee?._id || '',
    brewMethod: 'Pour Over',
    brewTemperature: 93,
    brewRatio: { coffee: 15, water: 250 },
    grindSize: 'Medium',
    brewTime: 240,
    rating: 3,
    notes: '',
    flavorNotes: [],
    isPublic: false,
    extras: {
      bloomTime: 30, numberOfPours: 1,
      waterType: '', grinder: '', modifications: ''
    }
  });

  const [pendingImages, setPendingImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [coffeeSearch, setCoffeeSearch] = useState('');
  const [coffeeSearchResults, setCoffeeSearchResults] = useState([]);
  const [selectedCoffeeDetails, setSelectedCoffeeDetails] = useState(selectedCoffee);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const brewMethodDefaults = {
    'Espresso': { temp: 93, time: 25, grindSize: 'Fine', coffee: 18, water: 36 },
    'Pour Over': { temp: 93, time: 240, grindSize: 'Medium', coffee: 15, water: 250 },
    'V60': { temp: 93, time: 210, grindSize: 'Medium-Fine', coffee: 15, water: 250 },
    'Chemex': { temp: 94, time: 300, grindSize: 'Medium-Coarse', coffee: 30, water: 500 },
    'French Press': { temp: 94, time: 240, grindSize: 'Coarse', coffee: 30, water: 450 },
    'Aeropress': { temp: 85, time: 90, grindSize: 'Fine', coffee: 15, water: 225 },
    'Cold Brew': { temp: 20, time: 43200, grindSize: 'Coarse', coffee: 80, water: 640 },
    'Moka Pot': { temp: 100, time: 300, grindSize: 'Fine', coffee: 20, water: 200 },
    'Kalita Wave': { temp: 93, time: 210, grindSize: 'Medium', coffee: 20, water: 320 },
    'Siphon': { temp: 92, time: 120, grindSize: 'Medium', coffee: 25, water: 375 }
  };

  useEffect(() => {
    if (coffeeSearch.length > 2) {
      const searchTimer = setTimeout(async () => {
        try {
          const results = await searchCoffees(coffeeSearch);
          setCoffeeSearchResults(results);
        } catch (error) {
          console.error('Error searching coffees:', error);
        }
      }, 300);
      return () => clearTimeout(searchTimer);
    } else {
      setCoffeeSearchResults([]);
    }
  }, [coffeeSearch]);

  // Clean up image preview URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const totalImages = pendingImages.length + files.length;
    if (totalImages > 5) {
      setErrors((prev) => ({
        ...prev,
        images: `Maximum 5 images allowed. You selected ${totalImages}.`,
      }));
      return;
    }

    // Validate each file
    const validFiles = files.filter((file) => {
      if (file.size > 10 * 1024 * 1024) return false;
      if (!/^image\/(jpeg|png|webp|heic)$/.test(file.type)) return false;
      return true;
    });

    if (validFiles.length !== files.length) {
      setErrors((prev) => ({
        ...prev,
        images: 'Some files were skipped (max 10MB, jpg/png/webp/heic only)',
      }));
    }

    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));

    setPendingImages((prev) => [...prev, ...validFiles]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    setErrors((prev) => ({ ...prev, images: null }));
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBrewMethodChange = (method) => {
    const defaults = brewMethodDefaults[method];
    if (defaults) {
      setFormData({
        ...formData,
        brewMethod: method,
        brewTemperature: defaults.temp,
        brewTime: defaults.time,
        grindSize: defaults.grindSize,
        brewRatio: { coffee: defaults.coffee, water: defaults.water }
      });
    } else {
      setFormData({ ...formData, brewMethod: method });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.coffee) newErrors.coffee = 'Please select a coffee';
    if (!formData.brewMethod) newErrors.brewMethod = 'Brew method is required';
    if (formData.brewTemperature < 0 || formData.brewTemperature > 100) {
      newErrors.brewTemperature = 'Temperature must be between 0-100°C';
    }
    if (formData.brewRatio.coffee <= 0) newErrors.brewRatio = 'Coffee amount must be positive';
    if (formData.brewRatio.water <= 0) newErrors.brewRatio = 'Water amount must be positive';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const dataToSubmit = {
        ...formData,
        brewTime: formData.brewTime || undefined,
        flavorNotes: formData.flavorNotes.filter(note => note.trim() !== ''),
        // Pass pending images so parent can upload after creation
        _pendingImages: pendingImages,
      };

      await onSubmit(dataToSubmit);
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: type === 'number' ? parseFloat(value) : value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked :
          type === 'number' ? parseFloat(value) : value
      });
    }
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const handleCoffeeSelect = (coffee) => {
    setFormData({ ...formData, coffee: coffee._id });
    setSelectedCoffeeDetails(coffee);
    setCoffeeSearch('');
    setCoffeeSearchResults([]);
  };

  const addFlavorNote = (note) => {
    if (note && !formData.flavorNotes.includes(note)) {
      setFormData({ ...formData, flavorNotes: [...formData.flavorNotes, note] });
    }
  };

  const removeFlavorNote = (noteToRemove) => {
    setFormData({
      ...formData,
      flavorNotes: formData.flavorNotes.filter(note => note !== noteToRemove)
    });
  };

  const formatBrewTime = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const parseBrewTime = (timeStr) => {
    const [mins, secs] = timeStr.split(':').map(n => parseInt(n) || 0);
    return mins * 60 + secs;
  };

  return (
    <form onSubmit={handleSubmit} className="add-brew-form">
      <h2>Record a Brew</h2>

      {errors.general && <div className="error-message">{errors.general}</div>}

      {/* Coffee Selection */}
      <div className="form-group">
        <label htmlFor="coffee">Coffee*</label>
        {selectedCoffeeDetails ? (
          <div className="selected-coffee">
            <div className="coffee-details">
              <strong>{selectedCoffeeDetails.name}</strong>
              <span>{selectedCoffeeDetails.roaster} - {selectedCoffeeDetails.origin}</span>
            </div>
            <button
              type="button"
              className="btn-text"
              onClick={() => {
                setSelectedCoffeeDetails(null);
                setFormData({ ...formData, coffee: '' });
              }}
            >Change</button>
          </div>
        ) : (
          <div className="coffee-search">
            <input
              type="text"
              placeholder="Search for a coffee..."
              value={coffeeSearch}
              onChange={(e) => setCoffeeSearch(e.target.value)}
              className={errors.coffee ? 'error' : ''}
            />
            {coffeeSearchResults.length > 0 && (
              <div className="search-results">
                {coffeeSearchResults.map(coffee => (
                  <div
                    key={coffee._id}
                    className="search-result"
                    onClick={() => handleCoffeeSelect(coffee)}
                  >
                    <strong>{coffee.name}</strong>
                    <span>{coffee.roaster} - {coffee.origin}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {errors.coffee && <span className="field-error">{errors.coffee}</span>}
      </div>

      {/* Brew Method */}
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="brewMethod">Brew Method*</label>
          <select
            id="brewMethod"
            name="brewMethod"
            value={formData.brewMethod}
            onChange={(e) => handleBrewMethodChange(e.target.value)}
          >
            {['Espresso', 'Pour Over', 'V60', 'Chemex', 'French Press', 'Aeropress',
              'Cold Brew', 'Moka Pot', 'Kalita Wave', 'Siphon', 'Other'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="grindSize">Grind Size*</label>
          <select id="grindSize" name="grindSize" value={formData.grindSize} onChange={handleChange}>
            {['Extra Fine', 'Fine', 'Medium-Fine', 'Medium', 'Medium-Coarse', 'Coarse', 'Extra Coarse'].map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Temperature and Time */}
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="brewTemperature">
            Temperature (°C)* <span className="hint">{formData.brewTemperature}°C</span>
          </label>
          <input
            type="range" id="brewTemperature" name="brewTemperature"
            min="0" max="100" step="1"
            value={formData.brewTemperature} onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="brewTime">Brew Time</label>
          <input
            type="text" id="brewTime" placeholder="mm:ss"
            value={formatBrewTime(formData.brewTime)}
            onChange={(e) => setFormData({ ...formData, brewTime: parseBrewTime(e.target.value) })}
          />
        </div>
      </div>

      {/* Brew Ratio */}
      <div className="form-group">
        <label>Brew Ratio*</label>
        <div className="brew-ratio">
          <input
            type="number" name="brewRatio.coffee" value={formData.brewRatio.coffee}
            onChange={handleChange} step="0.1" min="0" placeholder="Coffee (g)"
            className={errors.brewRatio ? 'error' : ''}
          />
          <span>:</span>
          <input
            type="number" name="brewRatio.water" value={formData.brewRatio.water}
            onChange={handleChange} step="1" min="0" placeholder="Water (g)"
            className={errors.brewRatio ? 'error' : ''}
          />
          <span className="ratio-display">
            (1:{(formData.brewRatio.water / formData.brewRatio.coffee).toFixed(1)})
          </span>
        </div>
        {errors.brewRatio && <span className="field-error">{errors.brewRatio}</span>}
      </div>

      {/* Rating */}
      <div className="form-group">
        <label htmlFor="rating">Rating*</label>
        <div className="rating-input">
          <input
            type="range" id="rating" name="rating"
            min="1" max="5" value={formData.rating} onChange={handleChange}
          />
          <span className="rating-display">
            {'★'.repeat(formData.rating)}{'☆'.repeat(5 - formData.rating)}
          </span>
        </div>
      </div>

      {/* ── Brew Photos (NEW) ── */}
      <div className="form-group">
        <label>Brew Photos (optional, max 5)</label>
        <div className="brew-image-upload">
          {imagePreviews.length > 0 && (
            <div className="image-preview-grid">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="image-preview-item">
                  <img src={preview} alt={`Preview ${index + 1}`} />
                  <button
                    type="button"
                    className="remove-preview"
                    onClick={() => removeImage(index)}
                  >×</button>
                </div>
              ))}
            </div>
          )}
          {pendingImages.length < 5 && (
            <label className="image-upload-trigger">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                multiple
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
              <span className="upload-icon">📷</span>
              <span>Add Photos</span>
            </label>
          )}
          {errors.images && <span className="field-error">{errors.images}</span>}
        </div>
      </div>

      {/* Tasting Notes */}
      <div className="form-group">
        <label htmlFor="notes">Tasting Notes</label>
        <textarea
          id="notes" name="notes" value={formData.notes}
          onChange={handleChange} placeholder="Describe the taste, aroma, mouthfeel..."
          rows="3"
        />
      </div>

      {/* Flavor Notes */}
      <div className="form-group">
        <label>Flavor Notes</label>
        <div className="flavor-notes">
          {formData.flavorNotes.map((note, index) => (
            <span key={index} className="flavor-tag">
              {note}
              <button type="button" onClick={() => removeFlavorNote(note)} className="remove-tag">×</button>
            </span>
          ))}
          <input
            type="text"
            placeholder="Add flavor note..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addFlavorNote(e.target.value);
                e.target.value = '';
              }
            }}
          />
        </div>
      </div>

      {/* Advanced Options */}
      <div className="advanced-section">
        <button type="button" className="btn-text" onClick={() => setShowAdvanced(!showAdvanced)}>
          {showAdvanced ? '▼' : '▶'} Advanced Options
        </button>
        {showAdvanced && (
          <div className="advanced-options">
            {formData.brewMethod === 'Pour Over' && (
              <>
                <div className="form-group">
                  <label>Bloom Time (seconds)</label>
                  <input type="number" name="extras.bloomTime" value={formData.extras.bloomTime} onChange={handleChange} min="0" />
                </div>
                <div className="form-group">
                  <label>Number of Pours</label>
                  <input type="number" name="extras.numberOfPours" value={formData.extras.numberOfPours} onChange={handleChange} min="1" />
                </div>
              </>
            )}
            {formData.brewMethod === 'Espresso' && (
              <>
                <div className="form-group">
                  <label>Pressure (bars)</label>
                  <input type="number" name="extras.pressure" value={formData.extras.pressure} onChange={handleChange} step="0.1" min="0" />
                </div>
                <div className="form-group">
                  <label>Yield (g)</label>
                  <input type="number" name="extras.yield" value={formData.extras.yield} onChange={handleChange} step="0.1" min="0" />
                </div>
              </>
            )}
            <div className="form-group">
              <label>Water Type</label>
              <input type="text" name="extras.waterType" value={formData.extras.waterType} onChange={handleChange} placeholder="e.g., Filtered" />
            </div>
            <div className="form-group">
              <label>Grinder</label>
              <input type="text" name="extras.grinder" value={formData.extras.grinder} onChange={handleChange} placeholder="e.g., Baratza Encore" />
            </div>
            <div className="form-group">
              <label>Modifications</label>
              <textarea name="extras.modifications" value={formData.extras.modifications} onChange={handleChange} rows="2" />
            </div>
          </div>
        )}
      </div>

      {/* Share Option */}
      <div className="form-group">
        <label className="checkbox-label">
          <input type="checkbox" name="isPublic" checked={formData.isPublic} onChange={handleChange} />
          Share this brew publicly
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save Brew'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AddBrewForm;