import React, { useState } from 'react';

const AddCoffeeForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    roaster: '',
    origin: '',
    roastDate: new Date().toISOString().split('T')[0],
    brewMethod: 'Pour Over',
    rating: 3,
    notes: '',
    price: '',
    isPublic: true,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Coffee name is required';
    }
    if (!formData.roaster.trim()) {
      newErrors.roaster = 'Roaster is required';
    }
    if (!formData.origin.trim()) {
      newErrors.origin = 'Origin is required';
    }
    if (!formData.roastDate) {
      newErrors.roastDate = 'Roast date is required';
    }
    if (formData.price && formData.price < 0) {
      newErrors.price = 'Price must be positive';
    }

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
        price: formData.price ? parseFloat(formData.price) : undefined,
        rating: parseInt(formData.rating)
      };

      await onSubmit(dataToSubmit);
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-coffee-form">
      <h2>Add New Coffee</h2>

      {errors.general && <div className="error-message">{errors.general}</div>}

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="name">Coffee Name*</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Ethiopian Yirgacheffe"
            className={errors.name ? 'error' : ''}
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="roaster">Roaster*</label>
          <input
            type="text"
            id="roaster"
            name="roaster"
            value={formData.roaster}
            onChange={handleChange}
            placeholder="e.g., Blue Bottle"
            className={errors.roaster ? 'error' : ''}
          />
          {errors.roaster && <span className="field-error">{errors.roaster}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="origin">Origin*</label>
          <input
            type="text"
            id="origin"
            name="origin"
            value={formData.origin}
            onChange={handleChange}
            placeholder="e.g., Ethiopia"
            className={errors.origin ? 'error' : ''}
          />
          {errors.origin && <span className="field-error">{errors.origin}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="roastDate">Roast Date*</label>
          <input
            type="date"
            id="roastDate"
            name="roastDate"
            value={formData.roastDate}
            onChange={handleChange}
            className={errors.roastDate ? 'error' : ''}
          />
          {errors.roastDate && <span className="field-error">{errors.roastDate}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="isPublic">Public*</label>
          <select
            id="isPublic"
            name="isPublic"
            value={formData.isPublic}
            onChange={handleChange}
          >
            <option value={true}>Yes</option>
            <option value={false}>No</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="rating">Rating*</label>
          <div className="rating-input">
            <input
              type="range"
              id="rating"
              name="rating"
              min="1"
              max="5"
              value={formData.rating}
              onChange={handleChange}
            />
            <span className="rating-display">
              {'★'.repeat(formData.rating)}{'☆'.repeat(5 - formData.rating)}
            </span>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="price">Price (optional)</label>
        <input
          type="number"
          id="price"
          name="price"
          step="0.01"
          value={formData.price}
          onChange={handleChange}
          placeholder="0.00"
          className={errors.price ? 'error' : ''}
        />
        {errors.price && <span className="field-error">{errors.price}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="notes">Tasting Notes (optional)</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Describe the flavor profile, aroma, etc."
          rows="3"
        />
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add Coffee'}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AddCoffeeForm;
