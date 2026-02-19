// src/components/profile/ProfileSettings.jsx
import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateProfile, changePassword, deleteAccount, uploadAvatar, deleteAvatar } from '../../api/profile';
import UserAvatar from '../common/UserAvatar';

const ProfileSettings = ({ user }) => {
    const { logout, refreshUser } = useAuth();
    const [activeSection, setActiveSection] = useState('profile');
    const avatarInputRef = useRef(null);

    // Profile form state
    const [profileData, setProfileData] = useState({
        username: user?.username || '',
        email: user?.email || ''
    });
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileMessage, setProfileMessage] = useState(null);

    // Avatar state
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [avatarMessage, setAvatarMessage] = useState(null);

    // Password form state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '', newPassword: '', confirmPassword: ''
    });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState(null);

    // Delete account state
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileMessage(null);
        try {
            await updateProfile(profileData);
            setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
            if (refreshUser) refreshUser();
        } catch (err) {
            setProfileMessage({ type: 'error', text: err.error || 'Failed to update profile' });
        } finally {
            setProfileLoading(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setAvatarMessage({ type: 'error', text: 'Image must be under 5MB' });
            return;
        }

        setAvatarLoading(true);
        setAvatarMessage(null);
        try {
            await uploadAvatar(file);
            setAvatarMessage({ type: 'success', text: 'Avatar updated!' });
            if (refreshUser) refreshUser();
        } catch (err) {
            setAvatarMessage({ type: 'error', text: err.message || 'Failed to upload avatar' });
        } finally {
            setAvatarLoading(false);
            // Reset file input
            if (avatarInputRef.current) avatarInputRef.current.value = '';
        }
    };

    const handleAvatarDelete = async () => {
        if (!window.confirm('Remove your profile photo?')) return;

        setAvatarLoading(true);
        setAvatarMessage(null);
        try {
            await deleteAvatar();
            setAvatarMessage({ type: 'success', text: 'Avatar removed' });
            if (refreshUser) refreshUser();
        } catch (err) {
            setAvatarMessage({ type: 'error', text: err.message || 'Failed to remove avatar' });
        } finally {
            setAvatarLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordMessage(null);

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }
        if (passwordData.newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setPasswordLoading(true);
        try {
            await changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setPasswordMessage({ type: 'error', text: err.error || 'Failed to change password' });
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) return;
        setDeleteLoading(true);
        try {
            await deleteAccount(deletePassword);
            await logout();
            window.location.href = '/';
        } catch (err) {
            alert(err.error || 'Failed to delete account');
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="profile-settings">
            <div className="settings-nav">
                <button
                    className={`settings-nav-item ${activeSection === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveSection('profile')}
                >Edit Profile</button>
                <button
                    className={`settings-nav-item ${activeSection === 'password' ? 'active' : ''}`}
                    onClick={() => setActiveSection('password')}
                >Change Password</button>
                <button
                    className={`settings-nav-item danger ${activeSection === 'delete' ? 'active' : ''}`}
                    onClick={() => setActiveSection('delete')}
                >Delete Account</button>
            </div>

            <div className="settings-content">
                {activeSection === 'profile' && (
                    <div className="settings-form">
                        {/* ── Avatar Section ── */}
                        <div className="avatar-settings">
                            <h3>Profile Photo</h3>

                            {avatarMessage && (
                                <div className={`message ${avatarMessage.type}`}>
                                    {avatarMessage.text}
                                </div>
                            )}

                            <div className="avatar-edit-row">
                                <UserAvatar user={user} size="large" />
                                <div className="avatar-actions">
                                    <label className={`btn btn-secondary ${avatarLoading ? 'disabled' : ''}`}>
                                        <input
                                            ref={avatarInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,image/heic"
                                            onChange={handleAvatarUpload}
                                            disabled={avatarLoading}
                                            style={{ display: 'none' }}
                                        />
                                        {avatarLoading ? 'Uploading...' : '📷 Upload Photo'}
                                    </label>
                                    {user?.avatar?.url && (
                                        <button
                                            type="button"
                                            className="btn btn-danger-outline"
                                            onClick={handleAvatarDelete}
                                            disabled={avatarLoading}
                                        >
                                            Remove Photo
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <hr className="settings-divider" />

                        {/* ── Profile Fields ── */}
                        <form onSubmit={handleProfileSubmit}>
                            <h3>Edit Profile</h3>

                            {profileMessage && (
                                <div className={`message ${profileMessage.type}`}>
                                    {profileMessage.text}
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="username">Username</label>
                                <input
                                    type="text" id="username"
                                    value={profileData.username}
                                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                                    minLength={3} required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email" id="email"
                                    value={profileData.email}
                                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                    required
                                />
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={profileLoading}>
                                {profileLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                )}

                {activeSection === 'password' && (
                    <form onSubmit={handlePasswordSubmit} className="settings-form">
                        <h3>Change Password</h3>
                        {passwordMessage && (
                            <div className={`message ${passwordMessage.type}`}>{passwordMessage.text}</div>
                        )}
                        <div className="form-group">
                            <label htmlFor="currentPassword">Current Password</label>
                            <input
                                type="password" id="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="newPassword">New Password</label>
                            <input
                                type="password" id="newPassword"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                minLength={6} required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm New Password</label>
                            <input
                                type="password" id="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                minLength={6} required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
                            {passwordLoading ? 'Changing...' : 'Change Password'}
                        </button>
                    </form>
                )}

                {activeSection === 'delete' && (
                    <div className="settings-form danger-zone">
                        <h3>Delete Account</h3>
                        <div className="warning-box">
                            <p><strong>⚠️ Warning:</strong> This action cannot be undone.</p>
                            <p>Deleting your account will permanently remove:</p>
                            <ul>
                                <li>Your profile and all personal information</li>
                                <li>All your brew records and photos</li>
                                <li>All your coffee ratings</li>
                                <li>Your friends list</li>
                            </ul>
                        </div>
                        {!showDeleteConfirm ? (
                            <button type="button" className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>
                                I want to delete my account
                            </button>
                        ) : (
                            <div className="delete-confirm">
                                <p>Please enter your password to confirm:</p>
                                <div className="form-group">
                                    <input
                                        type="password" value={deletePassword}
                                        onChange={(e) => setDeletePassword(e.target.value)}
                                        placeholder="Enter your password"
                                    />
                                </div>
                                <div className="button-group">
                                    <button
                                        type="button" className="btn btn-danger"
                                        onClick={handleDeleteAccount}
                                        disabled={deleteLoading || !deletePassword}
                                    >{deleteLoading ? 'Deleting...' : 'Permanently Delete Account'}</button>
                                    <button
                                        type="button" className="btn btn-secondary"
                                        onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); }}
                                    >Cancel</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileSettings;