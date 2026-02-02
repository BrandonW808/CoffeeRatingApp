import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navigation from './components/layout/Navigation';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import PrivateRoute from './components/auth/PrivateRoute';
import CoffeeList from './components/coffee/CoffeeList';
import BrewList from './components/brew/BrewList';
import Dashboard from './components/Dashboard';
import './styles/app.css';
import './styles/brew-styles.css';
import './styles/dashboard-styles.css';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navigation />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/coffees"
                element={
                  <PrivateRoute>
                    <CoffeeList />
                  </PrivateRoute>
                }
              />
              <Route
                path="/brews"
                element={
                  <PrivateRoute>
                    <ErrorBoundary>
                      <BrewList viewMode="personal" />
                    </ErrorBoundary>
                  </PrivateRoute>
                }
              />
              <Route
                path="/discover"
                element={<BrewList viewMode="public" />}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

const HomePage = () => {
  return (
    <div className="home-page">
      <div className="hero">
        <h1>Track Your Coffee Journey</h1>
        <p>Rate, review, and share every brew you make</p>
        <div className="hero-actions">
          <a href="/register" className="btn btn-primary btn-large">
            Get Started
          </a>
          <a href="/login" className="btn btn-secondary btn-large">
            Login
          </a>
        </div>
      </div>

      <div className="features">
        <div className="feature">
          <h3>🌡️ Track Brew Parameters</h3>
          <p>Record temperature, ratio, grind size, and brew time</p>
        </div>
        <div className="feature">
          <h3>☕ Manage Your Coffee Library</h3>
          <p>Keep track of all your coffee beans in one place</p>
        </div>
        <div className="feature">
          <h3>🌍 Share & Discover</h3>
          <p>Share your best brews and discover recipes from others</p>
        </div>
        <div className="feature">
          <h3>📊 Detailed Analytics</h3>
          <p>Understand your coffee preferences with detailed stats</p>
        </div>
        <div className="feature">
          <h3>❤️ Social Features</h3>
          <p>Like and save interesting brews from the community</p>
        </div>
        <div className="feature">
          <h3>💾 Export Your Data</h3>
          <p>Download your complete brew history anytime</p>
        </div>
      </div>
    </div>
  );
};

export default App;
