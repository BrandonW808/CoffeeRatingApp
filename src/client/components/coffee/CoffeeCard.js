import React, { useState } from 'react';

const CoffeeCard = ({ coffee, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(coffee);

  const handleSave = async () => {
    try {
      await onUpdate(coffee._id, editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update coffee:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
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
          value={editData.brewMethod}
          onChange={(e) => setEditData({ ...editData, brewMethod: e.target.value })}
        >
          <option value="Espresso">Espresso</option>
          <option value="Pour Over">Pour Over</option>
          <option value="French Press">French Press</option>
          <option value="Aeropress">Aeropress</option>
          <option value="Cold Brew">Cold Brew</option>
          <option value="Other">Other</option>
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
      <div className="card-header">
        <h3>{coffee.name}</h3>
        <span className="rating">{renderStars(coffee.rating)}</span>
      </div>
      <div className="card-body">
        <p><strong>Roaster:</strong> {coffee.roaster}</p>
        <p><strong>Origin:</strong> {coffee.origin}</p>
        <p><strong>Roast Date:</strong> {formatDate(coffee.roastDate)}</p>
        <p><strong>Brew Method:</strong> {coffee.brewMethod}</p>
        {coffee.price && <p><strong>Price:</strong> ${coffee.price.toFixed(2)}</p>}
        {coffee.notes && <p className="notes"><strong>Notes:</strong> {coffee.notes}</p>}
      </div>
      <div className="card-footer">
        <button 
          onClick={() => setIsEditing(true)} 
          className="btn btn-edit"
        >
          Edit
        </button>
        <button 
          onClick={() => onDelete(coffee._id)} 
          className="btn btn-delete"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default CoffeeCard;
