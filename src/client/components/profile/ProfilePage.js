// src/components/profile/ProfilePage.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import FriendsManager from '../friends/FriendsManager';
import ProfileSettings from './ProfileSettings';

const ProfilePage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="profile-page">
            <div className="profile-header-section">
                <div className="profile-avatar large">
                    {user?.username?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="profile-info">
                    <h1>{user?.username}</h1>
                    <p className="profile-email">{user?.email}</p>
                    <p className="profile-joined">
                        Member since {user?.createdAt ? formatDate(user.createdAt) : 'Unknown'}
                    </p>
                </div>
            </div>

            <div className="profile-tabs">
                <button
                    className={`profile-tab ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button
                    className={`profile-tab ${activeTab === 'friends' ? 'active' : ''}`}
                    onClick={() => setActiveTab('friends')}
                >
                    Friends
                </button>
                <button
                    className={`profile-tab ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    Settings
                </button>
            </div>

            <div className="profile-content">
                {activeTab === 'overview' && (
                    <ProfileOverview user={user} />
                )}
                {activeTab === 'friends' && (
                    <FriendsManager />
                )}
                {activeTab === 'settings' && (
                    <ProfileSettings user={user} />
                )}
            </div>
        </div>
    );
};

const ProfileOverview = ({ user }) => {
    return (
        <div className="profile-overview">
            <div className="overview-section">
                <h2>Quick Stats</h2>
                <p className="placeholder-text">
                    Your coffee journey stats will appear here as you log more brews!
                </p>
            </div>

            <div className="overview-section">
                <h2>Recent Activity</h2>
                <p className="placeholder-text">
                    Your recent brewing activity will be shown here.
                </p>
            </div>

            <div className="quick-links">
                <h2>Quick Links</h2>
                <div className="link-grid">
                    <a href="/brews" className="quick-link-card">
                        <span className="link-icon">☕</span>
                        <span>My Brews</span>
                    </a>
                    <a href="/coffees" className="quick-link-card">
                        <span className="link-icon">🫘</span>
                        <span>My Coffees</span>
                    </a>
                    <a href="/discover" className="quick-link-card">
                        <span className="link-icon">🌍</span>
                        <span>Discover</span>
                    </a>
                    <a href="/dashboard" className="quick-link-card">
                        <span className="link-icon">📊</span>
                        <span>Dashboard</span>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;