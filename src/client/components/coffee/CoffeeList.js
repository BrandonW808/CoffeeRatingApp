import React, { useState, useEffect } from 'react';
import { coffeeAPI } from '../../api/coffee';
import CoffeeCard from './CoffeeCard';
import AddCoffeeForm from './AddCoffeeForm';

const CoffeeList = () => {
  const [coffees, setCoffees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchCoffees();
    fetchStats();
  }, [sortBy, sortOrder]);

  const fetchCoffees = async () => {
    try {
      setLoading(true);
      const response = await coffeeAPI.getCoffees({
        sortBy,
        order: sortOrder
      });
      setCoffees(response.coffees);
    } catch (err) {
      setError('Failed to load coffees');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await coffeeAPI.getStats();
      setStats(response);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleAddCoffee = async (coffeeData) => {
    try {
      await coffeeAPI.createCoffee(coffeeData);
      await fetchCoffees();
      await fetchStats();
      setShowAddForm(false);
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to add coffee');
    }
  };

  const handleUpdateCoffee = async (id, coffeeData) => {
    try {
      await coffeeAPI.updateCoffee(id, coffeeData);
      await fetchCoffees();
      await fetchStats();
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to update coffee');
    }
  };

  const handleDeleteCoffee = async (id) => {
    if (window.confirm('Are you sure you want to delete this coffee rating?')) {
      try {
        await coffeeAPI.deleteCoffee(id);
        await fetchCoffees();
        await fetchStats();
      } catch (err) {
        console.error('Failed to delete coffee:', err);
      }
    }
  };

  const handleExport = async () => {
    try {
      const data = await coffeeAPI.exportData();
      const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `coffee-ratings-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export data:', err);
    }
  };

  if (loading) {
    return <div className="loading">Loading your coffees...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="coffee-list-container">
      <div className="coffee-header">
        <h2>My Coffee Ratings</h2>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowAddForm(true)}
          >
            Add New Coffee
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleExport}
          >
            Export Data
          </button>
        </div>
      </div>

      {stats && (
        <div className="coffee-stats">
          <div className="stat-card">
            <h3>{stats.summary.totalCoffees}</h3>
            <p>Total Coffees</p>
          </div>
          <div className="stat-card">
            <h3>{stats.summary.averageRating?.toFixed(1) || '0'}</h3>
            <p>Average Rating</p>
          </div>
          <div className="stat-card">
            <h3>${stats.summary.totalSpent?.toFixed(2) || '0'}</h3>
            <p>Total Spent</p>
          </div>
        </div>
      )}

      <div className="sort-controls">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="createdAt">Date Added</option>
          <option value="roastDate">Roast Date</option>
          <option value="rating">Rating</option>
          <option value="name">Name</option>
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>

      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <AddCoffeeForm
              onSubmit={handleAddCoffee}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        </div>
      )}

      <div className="coffee-grid">
        {coffees.length === 0 ? (
          <div className="empty-state">
            <p>No coffees rated yet. Add your first one!</p>
          </div>
        ) : (
          coffees.map((coffee) => (
            <CoffeeCard
              key={coffee._id}
              coffee={coffee}
              onUpdate={handleUpdateCoffee}
              onDelete={handleDeleteCoffee}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CoffeeList;
