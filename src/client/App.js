import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navigation from './components/layout/Navigation';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import PrivateRoute from './components/auth/PrivateRoute';
import CoffeeList from './components/coffee/CoffeeList';
import './styles/app.css';

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
                    <CoffeeList />
                  </PrivateRoute>
                } 
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
        <p>Rate, review, and remember every cup of coffee you enjoy</p>
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
          <h3>📊 Track Your Ratings</h3>
          <p>Rate coffees from 1-5 stars and keep detailed notes</p>
        </div>
        <div className="feature">
          <h3>☕ Detailed Information</h3>
          <p>Record roaster, origin, brew method, and more</p>
        </div>
        <div className="feature">
          <h3>📈 View Statistics</h3>
          <p>See your coffee journey with insightful statistics</p>
        </div>
        <div className="feature">
          <h3>💾 Export Your Data</h3>
          <p>Download your coffee history anytime</p>
        </div>
      </div>
    </div>
  );
};

export default App;
