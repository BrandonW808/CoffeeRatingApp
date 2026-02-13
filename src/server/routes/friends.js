// server/routes/friends.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Friend = require('../models/Friend');
const User = require('../models/User');
const Brew = require('../models/Brew');
const auth = require('../middleware/auth');

// Search users to add as friends
router.get('/search', auth, async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.length < 2) {
            return res.json([]);
        }

        const users = await User.find({
            _id: { $ne: req.userId },
            username: new RegExp(q, 'i')
        })
            .select('username createdAt')
            .limit(20);

        // Get friendship status for each user
        const userIds = users.map(u => u._id);
        const friendships = await Friend.find({
            $or: [
                { requester: req.userId, recipient: { $in: userIds } },
                { recipient: req.userId, requester: { $in: userIds } }
            ]
        });

        const friendshipMap = new Map();
        friendships.forEach(f => {
            const otherId = f.requester.equals(req.userId)
                ? f.recipient.toString()
                : f.requester.toString();
            friendshipMap.set(otherId, {
                status: f.status,
                isRequester: f.requester.equals(req.userId),
                friendshipId: f._id
            });
        });

        const usersWithStatus = users.map(user => ({
            ...user.toObject(),
            friendshipStatus: friendshipMap.get(user._id.toString()) || null
        }));

        res.json(usersWithStatus);
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ error: 'Error searching users' });
    }
});

// Get all friends and pending requests
router.get('/', auth, async (req, res) => {
    try {
        const { status = 'all' } = req.query;

        let query = {
            $or: [
                { requester: req.userId },
                { recipient: req.userId }
            ]
        };

        if (status === 'accepted') {
            query.status = 'accepted';
        } else if (status === 'pending') {
            query.status = 'pending';
        } else if (status !== 'all') {
            query.status = status;
        }

        const friendships = await Friend.find(query)
            .populate('requester', 'username createdAt')
            .populate('recipient', 'username createdAt')
            .sort({ updatedAt: -1 });

        // Format response
        const formatted = friendships.map(f => {
            const isRequester = f.requester._id.equals(req.userId);
            const friend = isRequester ? f.recipient : f.requester;

            return {
                friendshipId: f._id,
                status: f.status,
                isRequester,
                friend: {
                    _id: friend._id,
                    username: friend.username,
                    createdAt: friend.createdAt
                },
                createdAt: f.createdAt,
                updatedAt: f.updatedAt
            };
        });

        // Separate into categories
        const accepted = formatted.filter(f => f.status === 'accepted');
        const pendingReceived = formatted.filter(f => f.status === 'pending' && !f.isRequester);
        const pendingSent = formatted.filter(f => f.status === 'pending' && f.isRequester);

        res.json({
            friends: accepted,
            pendingReceived,
            pendingSent,
            total: accepted.length
        });
    } catch (error) {
        console.error('Error fetching friends:', error);
        res.status(500).json({ error: 'Error fetching friends' });
    }
});

// Send friend request
router.post('/request', auth, async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        if (userId === req.userId) {
            return res.status(400).json({ error: 'Cannot send friend request to yourself' });
        }

        // Check if user exists
        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check for existing friendship
        const existing = await Friend.findOne({
            $or: [
                { requester: req.userId, recipient: userId },
                { requester: userId, recipient: req.userId }
            ]
        });

        if (existing) {
            if (existing.status === 'accepted') {
                return res.status(400).json({ error: 'Already friends with this user' });
            }
            if (existing.status === 'pending') {
                // If they sent us a request, accept it
                if (existing.requester.equals(userId)) {
                    existing.status = 'accepted';
                    existing.updatedAt = Date.now();
                    await existing.save();
                    return res.json({
                        message: 'Friend request accepted',
                        friendship: existing
                    });
                }
                return res.status(400).json({ error: 'Friend request already sent' });
            }
            if (existing.status === 'blocked') {
                return res.status(400).json({ error: 'Cannot send friend request to this user' });
            }
            if (existing.status === 'rejected') {
                // Allow re-requesting after rejection
                existing.status = 'pending';
                existing.requester = req.userId;
                existing.recipient = userId;
                existing.updatedAt = Date.now();
                await existing.save();
                return res.status(201).json({
                    message: 'Friend request sent',
                    friendship: existing
                });
            }
        }

        // Create new friend request
        const friendship = new Friend({
            requester: req.userId,
            recipient: userId,
            status: 'pending'
        });

        await friendship.save();

        res.status(201).json({
            message: 'Friend request sent',
            friendship
        });
    } catch (error) {
        console.error('Error sending friend request:', error);
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Friend request already exists' });
        }
        res.status(500).json({ error: 'Error sending friend request' });
    }
});

// Accept friend request
router.put('/accept/:friendshipId', auth, async (req, res) => {
    try {
        const friendship = await Friend.findOne({
            _id: req.params.friendshipId,
            recipient: req.userId,
            status: 'pending'
        });

        if (!friendship) {
            return res.status(404).json({ error: 'Friend request not found' });
        }

        friendship.status = 'accepted';
        friendship.updatedAt = Date.now();
        await friendship.save();

        await friendship.populate('requester', 'username');

        res.json({
            message: 'Friend request accepted',
            friendship
        });
    } catch (error) {
        console.error('Error accepting friend request:', error);
        res.status(500).json({ error: 'Error accepting friend request' });
    }
});

// Reject friend request
router.put('/reject/:friendshipId', auth, async (req, res) => {
    try {
        const friendship = await Friend.findOne({
            _id: req.params.friendshipId,
            recipient: req.userId,
            status: 'pending'
        });

        if (!friendship) {
            return res.status(404).json({ error: 'Friend request not found' });
        }

        friendship.status = 'rejected';
        friendship.updatedAt = Date.now();
        await friendship.save();

        res.json({
            message: 'Friend request rejected'
        });
    } catch (error) {
        console.error('Error rejecting friend request:', error);
        res.status(500).json({ error: 'Error rejecting friend request' });
    }
});

// Remove friend / Cancel request
router.delete('/:friendshipId', auth, async (req, res) => {
    try {
        const friendship = await Friend.findOneAndDelete({
            _id: req.params.friendshipId,
            $or: [
                { requester: req.userId },
                { recipient: req.userId }
            ]
        });

        if (!friendship) {
            return res.status(404).json({ error: 'Friendship not found' });
        }

        res.json({ message: 'Friend removed successfully' });
    } catch (error) {
        console.error('Error removing friend:', error);
        res.status(500).json({ error: 'Error removing friend' });
    }
});

// Get friend's public brews
router.get('/:friendId/brews', auth, async (req, res) => {
    try {
        const { friendId } = req.params;
        const { limit = 20, page = 1 } = req.query;

        // Verify friendship
        const friendship = await Friend.findOne({
            $or: [
                { requester: req.userId, recipient: friendId },
                { requester: friendId, recipient: req.userId }
            ],
            status: 'accepted'
        });

        if (!friendship) {
            return res.status(403).json({ error: 'Not friends with this user' });
        }

        const brews = await Brew.find({
            user: friendId,
            isPublic: true
        })
            .populate('coffee', 'name roaster origin')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Brew.countDocuments({
            user: friendId,
            isPublic: true
        });

        res.json({
            brews,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        console.error('Error fetching friend brews:', error);
        res.status(500).json({ error: 'Error fetching friend brews' });
    }
});

// Get friend's profile/stats
router.get('/:friendId/profile', auth, async (req, res) => {
    try {
        const { friendId } = req.params;

        // Verify friendship
        const friendship = await Friend.findOne({
            $or: [
                { requester: req.userId, recipient: friendId },
                { requester: friendId, recipient: req.userId }
            ],
            status: 'accepted'
        });

        if (!friendship) {
            return res.status(403).json({ error: 'Not friends with this user' });
        }

        const user = await User.findById(friendId).select('username createdAt');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get friend's public stats
        const brewStats = await Brew.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(friendId), isPublic: true } },
            {
                $group: {
                    _id: null,
                    totalBrews: { $sum: 1 },
                    averageRating: { $avg: '$rating' }
                }
            }
        ]);

        const brewMethodCounts = await Brew.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(friendId), isPublic: true } },
            { $group: { _id: '$brewMethod', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        res.json({
            user,
            stats: {
                totalPublicBrews: brewStats[0]?.totalBrews || 0,
                averageRating: brewStats[0]?.averageRating || 0,
                topBrewMethods: brewMethodCounts
            }
        });
    } catch (error) {
        console.error('Error fetching friend profile:', error);
        res.status(500).json({ error: 'Error fetching friend profile' });
    }
});

module.exports = router;