import React, { useState, useEffect } from 'react';
import BrewCard from './BrewCard';
import AddBrewForm from './AddBrewForm';
import BrewDetails from './BrewDetails';
import { getMyBrews, getPublicBrews, createBrew, updateBrew, deleteBrew } from '../../api/brew';
import { useAuth } from '../../contexts/AuthContext';

const BrewList = ({ viewMode = 'personal' }) => {
  const { user } = useAuth();
  const [brews, setBrews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBrew, setEditingBrew] = useState(null);
  const [selectedBrew, setSelectedBrew] = useState(null);
  const [filters, setFilters] = useState({
    sortBy: 'createdAt',
    order: 'desc',
    brewMethod: '',
    minRating: '',
    coffeeId: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  });

  useEffect(() => {
    fetchBrews();
  }, [viewMode, filters, pagination.page]);

  const fetchBrews = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: pagination.page,
        limit: 20,
        sortBy: filters.sortBy,
        order: filters.order
      };

      // Only add filters if they have values
      if (filters.brewMethod) params.brewMethod = filters.brewMethod;
      if (filters.minRating) params.minRating = filters.minRating;
      if (filters.coffeeId) params.coffeeId = filters.coffeeId;

      const response = viewMode === 'personal'
        ? await getMyBrews(params)
        : await getPublicBrews(params);

      // Ensure response has expected structure
      if (response && Array.isArray(response.brews)) {
        setBrews(response.brews);
        setPagination({
          page: response.currentPage || 1,
          totalPages: response.totalPages || 1,
          total: response.total || 0
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching brews:', err);
      setError(err?.error || err?.message || 'Failed to fetch brews');
      setBrews([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBrew = async (brewData) => {
    try {
      const newBrew = await createBrew(brewData);
      setBrews([newBrew, ...brews]);
      setShowAddForm(false);
      setPagination(prev => ({ ...prev, total: prev.total + 1 }));
    } catch (err) {
      throw err;
    }
  };

  const handleUpdateBrew = async (brewData) => {
    try {
      const updatedBrew = await updateBrew(editingBrew._id, brewData);
      setBrews(brews.map(b => b._id === updatedBrew._id ? updatedBrew : b));
      setEditingBrew(null);
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteBrew = async (brewId) => {
    if (!window.confirm('Are you sure you want to delete this brew?')) {
      return;
    }

    try {
      await deleteBrew(brewId);
      setBrews(brews.filter(b => b._id !== brewId));
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
    } catch (err) {
      setError(err.error || 'Failed to delete brew');
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters({ ...filters, [filterName]: value });
    setPagination({ ...pagination, page: 1 });
  };

  if (loading && brews.length === 0) {
    return <div className="loading">Loading brews...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="brew-list-container">
      <div className="brew-list-header">
        <h2>
          {viewMode === 'personal' ? 'My Brews' : 'Community Brews'}
          {pagination.total > 0 && <span className="count">({pagination.total})</span>}
        </h2>

        {viewMode === 'personal' && (
          <button
            className="btn btn-primary"
            onClick={() => setShowAddForm(true)}
          >
            + New Brew
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="brew-filters">
        <select
          value={filters.sortBy}
          onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          className="filter-select"
        >
          <option value="createdAt">Date</option>
          <option value="rating">Rating</option>
          <option value="brewTemperature">Temperature</option>
        </select>

        <select
          value={filters.order}
          onChange={(e) => handleFilterChange('order', e.target.value)}
          className="filter-select"
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>

        <select
          value={filters.brewMethod}
          onChange={(e) => handleFilterChange('brewMethod', e.target.value)}
          className="filter-select"
        >
          <option value="">All Methods</option>
          <option value="Espresso">Espresso</option>
          <option value="Pour Over">Pour Over</option>
          <option value="V60">V60</option>
          <option value="Chemex">Chemex</option>
          <option value="French Press">French Press</option>
          <option value="Aeropress">Aeropress</option>
          <option value="Cold Brew">Cold Brew</option>
          <option value="Other">Other</option>
        </select>

        <select
          value={filters.minRating}
          onChange={(e) => handleFilterChange('minRating', e.target.value)}
          className="filter-select"
        >
          <option value="">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4+ Stars</option>
          <option value="3">3+ Stars</option>
        </select>
      </div>

      {/* Brew Cards */}
      {brews.length === 0 ? (
        <div className="empty-state">
          <p>
            {viewMode === 'personal'
              ? "You haven't recorded any brews yet."
              : "No public brews found."}
          </p>
          {viewMode === 'personal' && (
            <button
              className="btn btn-primary"
              onClick={() => setShowAddForm(true)}
            >
              Record Your First Brew
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="brew-grid">
            {brews.map(brew => (
              <BrewCard
                key={brew._id}
                brew={brew}
                onEdit={viewMode === 'personal' ? setEditingBrew : null}
                onDelete={viewMode === 'personal' ? handleDeleteBrew : null}
                onViewDetails={setSelectedBrew}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={pagination.page === 1}
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                className="btn btn-secondary"
              >
                Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                className="btn btn-secondary"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Form Modal */}
      {(showAddForm || editingBrew) && (
        <div className="modal-overlay" onClick={() => {
          setShowAddForm(false);
          setEditingBrew(null);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <AddBrewForm
              brew={editingBrew}
              onSubmit={editingBrew ? handleUpdateBrew : handleCreateBrew}
              onCancel={() => {
                setShowAddForm(false);
                setEditingBrew(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Brew Details Modal */}
      {selectedBrew && (
        <div className="modal-overlay" onClick={() => setSelectedBrew(null)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <BrewDetails
              brew={selectedBrew}
              onClose={() => setSelectedBrew(null)}
              onEdit={viewMode === 'personal' && user?._id === selectedBrew.user._id ? () => {
                setEditingBrew(selectedBrew);
                setSelectedBrew(null);
              } : null}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BrewList;
