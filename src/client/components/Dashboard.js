import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBrewStats } from '../api/brew';
import { getPopularCoffees } from '../api/coffee';
import { getMyBrews } from '../api/brew';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentBrews, setRecentBrews] = useState([]);
  const [popularCoffees, setPopularCoffees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [brewStats, recent, popular] = await Promise.all([
        getBrewStats(),
        getMyBrews({ limit: 5, sortBy: 'createdAt', order: 'desc' }),
        getPopularCoffees(5)
      ]);
      setStats(brewStats);
      setRecentBrews(recent.brews);
      setPopularCoffees(popular);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.username}!</h1>
        <p>Here's your coffee journey at a glance</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Brews</h3>
          <div className="stat-value">{stats?.summary?.totalBrews || 0}</div>
          <Link to="/brews" className="stat-link">View all →</Link>
        </div>

        <div className="stat-card">
          <h3>Average Rating</h3>
          <div className="stat-value">
            {stats?.summary?.averageRating?.toFixed(1) || '0.0'}
            <span className="stat-unit">★</span>
          </div>
        </div>

        <div className="stat-card">
          <h3>Favorite Method</h3>
          <div className="stat-value small">
            {stats?.brewMethodDistribution?.[0]?._id || 'None yet'}
          </div>
        </div>

        <div className="stat-card">
          <h3>This Week</h3>
          <div className="stat-value">
            {recentBrews.filter(b => {
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return new Date(b.createdAt) > weekAgo;
            }).length}
            <span className="stat-unit">brews</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <Link to="/brews" className="action-card">
          <span className="action-icon">☕</span>
          <span className="action-text">Record a Brew</span>
        </Link>
        <Link to="/coffees" className="action-card">
          <span className="action-icon">🫘</span>
          <span className="action-text">Add Coffee</span>
        </Link>
        <Link to="/discover" className="action-card">
          <span className="action-icon">🌍</span>
          <span className="action-text">Discover Brews</span>
        </Link>
      </div>

      <div className="dashboard-sections">
        {/* Recent Brews */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2>Recent Brews</h2>
            <Link to="/brews" className="see-all">See all →</Link>
          </div>
          {recentBrews.length > 0 ? (
            <div className="recent-brews-list">
              {recentBrews.map(brew => (
                <div key={brew._id} className="recent-brew-item">
                  <div className="brew-info">
                    <strong>{brew.coffee.name}</strong>
                    <span className="brew-meta">
                      {brew.brewMethod} • {brew.rating}★
                    </span>
                  </div>
                  <span className="brew-date">
                    {new Date(brew.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-message">No brews recorded yet. Start your coffee journey!</p>
          )}
        </section>

        {/* Brew Method Distribution */}
        {stats?.brewMethodDistribution && stats.brewMethodDistribution.length > 0 && (
          <section className="dashboard-section">
            <h2>Brew Methods</h2>
            <div className="method-distribution">
              {stats.brewMethodDistribution.map(method => (
                <div key={method._id} className="method-bar">
                  <div className="method-label">
                    <span>{method._id}</span>
                    <span>{method.count}</span>
                  </div>
                  <div className="method-progress">
                    <div
                      className="method-fill"
                      style={{
                        width: `${(method.count / stats.summary.totalBrews) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Popular Coffees */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2>Popular in the Community</h2>
            <Link to="/discover" className="see-all">Explore →</Link>
          </div>
          {popularCoffees.length > 0 ? (
            <div className="popular-coffees">
              {popularCoffees.map(item => (
                <div key={item._id} className="popular-coffee-item">
                  <div className="coffee-details">
                    <strong>{item.coffee.name}</strong>
                    <span className="coffee-meta">
                      {item.coffee.roaster} • {item.brewCount} brews
                    </span>
                  </div>
                  <span className="avg-rating">
                    {item.averageRating.toFixed(1)}★
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-message">No community data available yet.</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
