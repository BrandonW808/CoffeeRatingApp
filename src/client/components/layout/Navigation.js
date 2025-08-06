import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navigation = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          ☕ Coffee Tracker
        </Link>
        
        <button 
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        
        <div className={`nav-menu ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          {isAuthenticated ? (
            <>
              <Link 
                to="/dashboard" 
                className={`nav-link ${isActive('/dashboard')}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                to="/brews" 
                className={`nav-link ${isActive('/brews')}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                My Brews
              </Link>
              <Link 
                to="/coffees" 
                className={`nav-link ${isActive('/coffees')}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Coffee Library
              </Link>
              <Link 
                to="/discover" 
                className={`nav-link ${isActive('/discover')}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Discover
              </Link>
              <div className="nav-user">
                <span className="username">👤 {user?.username}</span>
                <button onClick={handleLogout} className="btn btn-logout">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link 
                to="/discover" 
                className={`nav-link ${isActive('/discover')}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Discover
              </Link>
              <Link 
                to="/login" 
                className={`nav-link ${isActive('/login')}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="nav-link btn btn-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
