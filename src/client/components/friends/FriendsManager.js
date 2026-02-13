// src/components/friends/FriendsManager.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    searchUsers,
    getFriends,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend
} from '../../api/friends';
import debounce from 'lodash/debounce';

const FriendsManager = () => {
    const [activeTab, setActiveTab] = useState('friends');
    const [friends, setFriends] = useState([]);
    const [pendingReceived, setPendingReceived] = useState([]);
    const [pendingSent, setPendingSent] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState({});

    useEffect(() => {
        fetchFriends();
    }, []);

    const fetchFriends = async () => {
        try {
            setLoading(true);
            const data = await getFriends();
            setFriends(data.friends || []);
            setPendingReceived(data.pendingReceived || []);
            setPendingSent(data.pendingSent || []);
        } catch (err) {
            setError('Failed to load friends');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const debouncedSearch = useCallback(
        debounce(async (query) => {
            if (query.length < 2) {
                setSearchResults([]);
                setSearchLoading(false);
                return;
            }

            try {
                const results = await searchUsers(query);
                setSearchResults(results);
            } catch (err) {
                console.error('Search failed:', err);
            } finally {
                setSearchLoading(false);
            }
        }, 300),
        []
    );

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        setSearchLoading(true);
        debouncedSearch(query);
    };

    const handleSendRequest = async (userId) => {
        setActionLoading(prev => ({ ...prev, [userId]: true }));
        try {
            await sendFriendRequest(userId);
            await fetchFriends();
            // Update search results to reflect new status
            if (searchQuery) {
                debouncedSearch(searchQuery);
            }
        } catch (err) {
            setError(err.error || 'Failed to send friend request');
        } finally {
            setActionLoading(prev => ({ ...prev, [userId]: false }));
        }
    };

    const handleAcceptRequest = async (friendshipId) => {
        setActionLoading(prev => ({ ...prev, [friendshipId]: true }));
        try {
            await acceptFriendRequest(friendshipId);
            await fetchFriends();
        } catch (err) {
            setError(err.error || 'Failed to accept request');
        } finally {
            setActionLoading(prev => ({ ...prev, [friendshipId]: false }));
        }
    };

    const handleRejectRequest = async (friendshipId) => {
        setActionLoading(prev => ({ ...prev, [friendshipId]: true }));
        try {
            await rejectFriendRequest(friendshipId);
            await fetchFriends();
        } catch (err) {
            setError(err.error || 'Failed to reject request');
        } finally {
            setActionLoading(prev => ({ ...prev, [friendshipId]: false }));
        }
    };

    const handleRemoveFriend = async (friendshipId, friendName) => {
        if (!window.confirm(`Remove ${friendName} from friends?`)) {
            return;
        }

        setActionLoading(prev => ({ ...prev, [friendshipId]: true }));
        try {
            await removeFriend(friendshipId);
            await fetchFriends();
        } catch (err) {
            setError(err.error || 'Failed to remove friend');
        } finally {
            setActionLoading(prev => ({ ...prev, [friendshipId]: false }));
        }
    };

    const handleCancelRequest = async (friendshipId) => {
        setActionLoading(prev => ({ ...prev, [friendshipId]: true }));
        try {
            await removeFriend(friendshipId);
            await fetchFriends();
        } catch (err) {
            setError(err.error || 'Failed to cancel request');
        } finally {
            setActionLoading(prev => ({ ...prev, [friendshipId]: false }));
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const renderFriendshipButton = (user) => {
        const status = user.friendshipStatus;

        if (!status) {
            return (
                <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleSendRequest(user._id)}
                    disabled={actionLoading[user._id]}
                >
                    {actionLoading[user._id] ? 'Sending...' : 'Add Friend'}
                </button>
            );
        }

        if (status.status === 'accepted') {
            return <span className="status-badge accepted">✓ Friends</span>;
        }

        if (status.status === 'pending') {
            if (status.isRequester) {
                return (
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleCancelRequest(status.friendshipId)}
                        disabled={actionLoading[status.friendshipId]}
                    >
                        {actionLoading[status.friendshipId] ? 'Canceling...' : 'Cancel Request'}
                    </button>
                );
            } else {
                return (
                    <div className="button-group">
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleAcceptRequest(status.friendshipId)}
                            disabled={actionLoading[status.friendshipId]}
                        >
                            Accept
                        </button>
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleRejectRequest(status.friendshipId)}
                            disabled={actionLoading[status.friendshipId]}
                        >
                            Reject
                        </button>
                    </div>
                );
            }
        }

        return null;
    };

    if (loading) {
        return <div className="loading">Loading friends...</div>;
    }

    return (
        <div className="friends-manager">
            <div className="friends-header">
                <h2>Friends</h2>
                <div className="friends-stats">
                    <span>{friends.length} friends</span>
                    {pendingReceived.length > 0 && (
                        <span className="pending-badge">{pendingReceived.length} pending</span>
                    )}
                </div>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                    <button onClick={() => setError(null)} className="dismiss-btn">×</button>
                </div>
            )}

            {/* Search Section */}
            <div className="search-section">
                <div className="search-input-wrapper">
                    <input
                        type="text"
                        placeholder="Search users by username..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="search-input"
                    />
                    {searchLoading && <span className="search-spinner">⟳</span>}
                </div>

                {searchResults.length > 0 && (
                    <div className="search-results">
                        <h4>Search Results</h4>
                        <div className="user-list">
                            {searchResults.map(user => (
                                <div key={user._id} className="user-item">
                                    <div className="user-info">
                                        <span className="username">{user.username}</span>
                                        <span className="join-date">
                                            Joined {formatDate(user.createdAt)}
                                        </span>
                                    </div>
                                    {renderFriendshipButton(user)}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {searchQuery.length >= 2 && searchResults.length === 0 && !searchLoading && (
                    <div className="no-results">No users found matching "{searchQuery}"</div>
                )}
            </div>

            {/* Tabs */}
            <div className="friends-tabs">
                <button
                    className={`tab ${activeTab === 'friends' ? 'active' : ''}`}
                    onClick={() => setActiveTab('friends')}
                >
                    Friends ({friends.length})
                </button>
                <button
                    className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    Pending
                    {pendingReceived.length > 0 && (
                        <span className="tab-badge">{pendingReceived.length}</span>
                    )}
                </button>
                <button
                    className={`tab ${activeTab === 'sent' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sent')}
                >
                    Sent ({pendingSent.length})
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'friends' && (
                    <div className="friends-list">
                        {friends.length === 0 ? (
                            <div className="empty-state">
                                <p>No friends yet. Search for users above to add friends!</p>
                            </div>
                        ) : (
                            friends.map(({ friendshipId, friend }) => (
                                <div key={friendshipId} className="friend-card">
                                    <div className="friend-info">
                                        <div className="friend-avatar">
                                            {friend.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="friend-details">
                                            <span className="friend-name">{friend.username}</span>
                                            <span className="friend-meta">
                                                Member since {formatDate(friend.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="friend-actions">
                                        <a
                                            href={`/friends/${friend._id}`}
                                            className="btn btn-secondary btn-sm"
                                        >
                                            View Brews
                                        </a>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleRemoveFriend(friendshipId, friend.username)}
                                            disabled={actionLoading[friendshipId]}
                                        >
                                            {actionLoading[friendshipId] ? '...' : 'Remove'}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'pending' && (
                    <div className="pending-list">
                        {pendingReceived.length === 0 ? (
                            <div className="empty-state">
                                <p>No pending friend requests.</p>
                            </div>
                        ) : (
                            pendingReceived.map(({ friendshipId, friend, createdAt }) => (
                                <div key={friendshipId} className="request-card">
                                    <div className="request-info">
                                        <div className="friend-avatar">
                                            {friend.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="request-details">
                                            <span className="friend-name">{friend.username}</span>
                                            <span className="request-date">
                                                Sent {formatDate(createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="request-actions">
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handleAcceptRequest(friendshipId)}
                                            disabled={actionLoading[friendshipId]}
                                        >
                                            {actionLoading[friendshipId] ? '...' : 'Accept'}
                                        </button>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => handleRejectRequest(friendshipId)}
                                            disabled={actionLoading[friendshipId]}
                                        >
                                            {actionLoading[friendshipId] ? '...' : 'Reject'}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'sent' && (
                    <div className="sent-list">
                        {pendingSent.length === 0 ? (
                            <div className="empty-state">
                                <p>No sent requests waiting for response.</p>
                            </div>
                        ) : (
                            pendingSent.map(({ friendshipId, friend, createdAt }) => (
                                <div key={friendshipId} className="request-card">
                                    <div className="request-info">
                                        <div className="friend-avatar">
                                            {friend.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="request-details">
                                            <span className="friend-name">{friend.username}</span>
                                            <span className="request-date">
                                                Sent {formatDate(createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="request-actions">
                                        <span className="status-pending">Pending</span>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => handleCancelRequest(friendshipId)}
                                            disabled={actionLoading[friendshipId]}
                                        >
                                            {actionLoading[friendshipId] ? '...' : 'Cancel'}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FriendsManager;