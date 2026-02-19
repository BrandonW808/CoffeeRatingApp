// src/components/friends/FriendProfile.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFriendProfile, getFriendBrews } from '../../api/friends';
import StarRating from '../common/StarRating';
import UserAvatar from '../common/UserAvatar';

const FriendProfile = () => {
    const { friendId } = useParams();
    const [profile, setProfile] = useState(null);
    const [brews, setBrews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [brewsLoading, setBrewsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => { fetchProfile(); }, [friendId]);
    useEffect(() => { fetchBrews(); }, [friendId, page]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const data = await getFriendProfile(friendId);
            setProfile(data);
        } catch (err) {
            if (err.error === 'Not friends with this user') {
                setError('You need to be friends with this user to view their profile.');
            } else {
                setError('Failed to load profile');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchBrews = async () => {
        try {
            setBrewsLoading(true);
            const data = await getFriendBrews(friendId, { page, limit: 10 });
            setBrews(data.brews);
            setTotalPages(data.totalPages);
        } catch (err) {
            console.error('Failed to load brews:', err);
        } finally {
            setBrewsLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    if (loading) return <div className="loading">Loading profile...</div>;

    if (error) {
        return (
            <div className="error-container">
                <div className="error-message">{error}</div>
                <Link to="/profile" className="btn btn-primary">Back to Profile</Link>
            </div>
        );
    }

    return (
        <div className="friend-profile">
            <div className="profile-header">
                <Link to="/profile" className="back-link">← Back to Profile</Link>
                <div className="profile-info">
                    <UserAvatar user={profile.user} size="large" />
                    <div className="profile-details">
                        <h1>{profile.user.username}</h1>
                        <p className="member-since">
                            Member since {formatDate(profile.user.createdAt)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="profile-stats-grid">
                <div className="stat-card">
                    <h3>Public Brews</h3>
                    <div className="stat-value">{profile.stats.totalPublicBrews}</div>
                </div>
                <div className="stat-card">
                    <h3>Average Rating</h3>
                    <div className="stat-value">
                        {profile.stats.averageRating?.toFixed(1) || '0.0'}
                        <span className="stat-unit">★</span>
                    </div>
                </div>
                <div className="stat-card">
                    <h3>Top Method</h3>
                    <div className="stat-value small">
                        {profile.stats.topBrewMethods?.[0]?._id || 'N/A'}
                    </div>
                </div>
            </div>

            {profile.stats.topBrewMethods?.length > 0 && (
                <section className="profile-section">
                    <h2>Favorite Brew Methods</h2>
                    <div className="method-distribution">
                        {profile.stats.topBrewMethods.map(method => (
                            <div key={method._id} className="method-bar">
                                <div className="method-label">
                                    <span>{method._id}</span>
                                    <span>{method.count} brews</span>
                                </div>
                                <div className="method-progress">
                                    <div
                                        className="method-fill"
                                        style={{ width: `${(method.count / profile.stats.totalPublicBrews) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section className="profile-section">
                <h2>Public Brews</h2>
                {brewsLoading ? (
                    <div className="loading">Loading brews...</div>
                ) : brews.length === 0 ? (
                    <div className="empty-state"><p>No public brews shared yet.</p></div>
                ) : (
                    <>
                        <div className="brews-list">
                            {brews.map(brew => {
                                const brewImages = brew.images || [];
                                return (
                                    <div key={brew._id} className="brew-card">
                                        {brewImages.length > 0 && (
                                            <div className="brew-card-thumbnail">
                                                <img
                                                    src={brewImages[0].thumbnailUrl || brewImages[0].url}
                                                    alt={brew.coffee?.name || 'Brew'}
                                                    loading="lazy"
                                                />
                                                {brewImages.length > 1 && (
                                                    <span className="image-badge">+{brewImages.length - 1}</span>
                                                )}
                                            </div>
                                        )}
                                        <div className="brew-header">
                                            <h3>{brew.coffee?.name || 'Unknown Coffee'}</h3>
                                            <StarRating rating={brew.rating} />
                                        </div>
                                        <div className="brew-details">
                                            <span className="brew-method">{brew.brewMethod}</span>
                                            {brew.coffee?.roaster && (
                                                <span className="brew-roaster">{brew.coffee.roaster}</span>
                                            )}
                                        </div>
                                        {brew.notes && <p className="brew-notes">{brew.notes}</p>}
                                        <div className="brew-meta">
                                            <span>{formatDate(brew.createdAt)}</span>
                                            {brew.likes?.length > 0 && <span>❤️ {brew.likes.length}</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1} className="btn btn-secondary"
                                >Previous</button>
                                <span>Page {page} of {totalPages}</span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages} className="btn btn-secondary"
                                >Next</button>
                            </div>
                        )}
                    </>
                )}
            </section>
        </div>
    );
};

export default FriendProfile;