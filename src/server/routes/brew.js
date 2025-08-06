const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Brew = require('../models/Brew');
const Coffee = require('../models/Coffee');
const auth = require('../middleware/auth');

// Get all brews for logged-in user
router.get('/my-brews', auth, async (req, res) => {
  try {
    const {
      sortBy = 'createdAt',
      order = 'desc',
      limit = 50,
      page = 1,
      coffeeId
    } = req.query;

    const query = { user: req.userId };
    if (coffeeId) {
      query.coffee = coffeeId;
    }

    const brews = await Brew.find(query)
      .populate('coffee', 'name roaster origin roastDate')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Brew.countDocuments(query);

    res.json({
      brews,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Error fetching brews:', error);
    res.status(500).json({ error: 'Error fetching brews' });
  }
});

// Get public brews (for discovery)
router.get('/public', async (req, res) => {
  try {
    const {
      sortBy = 'createdAt',
      order = 'desc',
      limit = 50,
      page = 1,
      brewMethod,
      minRating
    } = req.query;

    const query = { isPublic: true };
    if (brewMethod) {
      query.brewMethod = brewMethod;
    }
    if (minRating) {
      query.rating = { $gte: parseInt(minRating) };
    }

    const brews = await Brew.find(query)
      .populate('coffee', 'name roaster origin roastDate')
      .populate('user', 'username')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Brew.countDocuments(query);

    res.json({
      brews,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Error fetching public brews:', error);
    res.status(500).json({ error: 'Error fetching public brews' });
  }
});

// Get single brew by ID
router.get('/:id', async (req, res) => {
  try {
    const brew = await Brew.findById(req.params.id)
      .populate('coffee', 'name roaster origin roastDate flavorNotes')
      .populate('user', 'username');

    if (!brew) {
      return res.status(404).json({ error: 'Brew not found' });
    }

    // Check if user has access to this brew
    const userId = req.userId || null;
    if (!brew.isPublic && (!userId || !brew.user._id.equals(userId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(brew);
  } catch (error) {
    console.error('Error fetching brew:', error);
    res.status(500).json({ error: 'Error fetching brew' });
  }
});

// Create new brew
router.post('/', [
  auth,
  body('coffee').isMongoId(),
  body('brewMethod').isIn(['Espresso', 'Pour Over', 'French Press', 'Aeropress', 'Cold Brew', 'Moka Pot', 'Chemex', 'V60', 'Kalita Wave', 'Siphon', 'Other']),
  body('brewTemperature').isFloat({ min: 0, max: 100 }),
  body('brewRatio.coffee').isFloat({ min: 0 }),
  body('brewRatio.water').isFloat({ min: 0 }),
  body('grindSize').isIn(['Extra Fine', 'Fine', 'Medium-Fine', 'Medium', 'Medium-Coarse', 'Coarse', 'Extra Coarse']),
  body('brewTime').optional().isInt({ min: 0 }),
  body('rating').isInt({ min: 1, max: 5 }),
  body('notes').optional().trim().isLength({ max: 1000 }),
  body('flavorNotes').optional().isArray(),
  body('isPublic').optional().isBoolean(),
  body('extras.bloomTime').optional().isInt({ min: 0 }),
  body('extras.numberOfPours').optional().isInt({ min: 1 }),
  body('extras.pressure').optional().isFloat({ min: 0 }),
  body('extras.yield').optional().isFloat({ min: 0 }),
  body('extras.waterType').optional().trim(),
  body('extras.grinder').optional().trim(),
  body('extras.modifications').optional().trim()
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verify coffee exists and user has access to it
    const coffee = await Coffee.findById(req.body.coffee);
    if (!coffee) {
      return res.status(404).json({ error: 'Coffee not found' });
    }

    // Check if user has access to this coffee (either they added it or it's public)
    if (!coffee.isPublic && !coffee.addedBy.equals(req.userId)) {
      return res.status(403).json({ error: 'Access denied to this coffee' });
    }

    const brew = new Brew({
      ...req.body,
      user: req.userId
    });

    await brew.save();
    
    // Populate coffee details before sending response
    await brew.populate('coffee', 'name roaster origin roastDate');
    
    res.status(201).json(brew);
  } catch (error) {
    console.error('Error creating brew:', error);
    res.status(500).json({ error: 'Error creating brew' });
  }
});

// Update brew
router.put('/:id', [
  auth,
  body('brewMethod').optional().isIn(['Espresso', 'Pour Over', 'French Press', 'Aeropress', 'Cold Brew', 'Moka Pot', 'Chemex', 'V60', 'Kalita Wave', 'Siphon', 'Other']),
  body('brewTemperature').optional().isFloat({ min: 0, max: 100 }),
  body('brewRatio.coffee').optional().isFloat({ min: 0 }),
  body('brewRatio.water').optional().isFloat({ min: 0 }),
  body('grindSize').optional().isIn(['Extra Fine', 'Fine', 'Medium-Fine', 'Medium', 'Medium-Coarse', 'Coarse', 'Extra Coarse']),
  body('brewTime').optional().isInt({ min: 0 }),
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('notes').optional().trim().isLength({ max: 1000 }),
  body('flavorNotes').optional().isArray(),
  body('isPublic').optional().isBoolean()
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const brew = await Brew.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('coffee', 'name roaster origin roastDate');

    if (!brew) {
      return res.status(404).json({ error: 'Brew not found' });
    }

    res.json(brew);
  } catch (error) {
    console.error('Error updating brew:', error);
    res.status(500).json({ error: 'Error updating brew' });
  }
});

// Delete brew
router.delete('/:id', auth, async (req, res) => {
  try {
    const brew = await Brew.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });

    if (!brew) {
      return res.status(404).json({ error: 'Brew not found' });
    }

    res.json({ message: 'Brew deleted successfully' });
  } catch (error) {
    console.error('Error deleting brew:', error);
    res.status(500).json({ error: 'Error deleting brew' });
  }
});

// Toggle like on a brew
router.post('/:id/like', auth, async (req, res) => {
  try {
    const brew = await Brew.findById(req.params.id);
    
    if (!brew) {
      return res.status(404).json({ error: 'Brew not found' });
    }

    // Check if brew is public or belongs to user
    if (!brew.isPublic && !brew.user.equals(req.userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const userIndex = brew.likes.indexOf(req.userId);
    
    if (userIndex > -1) {
      // User already liked, so unlike
      brew.likes.splice(userIndex, 1);
    } else {
      // User hasn't liked, so add like
      brew.likes.push(req.userId);
    }

    await brew.save();
    
    res.json({
      liked: userIndex === -1,
      likesCount: brew.likes.length
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: 'Error toggling like' });
  }
});

// Get brew statistics for user
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const stats = await Brew.aggregate([
      { $match: { user: req.userId } },
      {
        $group: {
          _id: null,
          totalBrews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          favoriteBrewMethod: { $first: '$brewMethod' }
        }
      }
    ]);

    const brewMethodCounts = await Brew.aggregate([
      { $match: { user: req.userId } },
      { $group: { _id: '$brewMethod', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const temperatureStats = await Brew.aggregate([
      { $match: { user: req.userId } },
      {
        $group: {
          _id: '$brewMethod',
          avgTemp: { $avg: '$brewTemperature' },
          minTemp: { $min: '$brewTemperature' },
          maxTemp: { $max: '$brewTemperature' }
        }
      }
    ]);

    res.json({
      summary: stats[0] || {
        totalBrews: 0,
        averageRating: 0
      },
      brewMethodDistribution: brewMethodCounts,
      temperatureStats
    });
  } catch (error) {
    console.error('Error fetching brew stats:', error);
    res.status(500).json({ error: 'Error fetching statistics' });
  }
});

// Export user's brew data as CSV
router.get('/export/csv', auth, async (req, res) => {
  try {
    const brews = await Brew.find({ user: req.userId })
      .populate('coffee', 'name roaster origin')
      .sort({ createdAt: -1 });

    if (!Array.isArray(brews) || brews.length === 0) {
      return res.status(204).send(); // No Content
    }

    // Define fields for CSV export
    const fields = [
      'coffeeName',
      'roaster',
      'origin',
      'brewMethod',
      'brewTemperature',
      'brewRatio',
      'grindSize',
      'brewTime',
      'rating',
      'notes',
      'createdAt'
    ];

    // Create the CSV header
    const csvHeader = fields.join(',');

    // Convert each brew to CSV row
    const csvRows = brews.map(brew => {
      const row = {
        coffeeName: brew.coffee.name,
        roaster: brew.coffee.roaster,
        origin: brew.coffee.origin,
        brewMethod: brew.brewMethod,
        brewTemperature: brew.brewTemperature,
        brewRatio: brew.brewRatioString || `${brew.brewRatio.coffee}:${brew.brewRatio.water}`,
        grindSize: brew.grindSize,
        brewTime: brew.brewTime ? `${Math.floor(brew.brewTime / 60)}:${(brew.brewTime % 60).toString().padStart(2, '0')}` : '',
        rating: brew.rating,
        notes: brew.notes || '',
        createdAt: brew.createdAt.toISOString()
      };

      return fields.map(field => {
        let val = row[field];
        if (typeof val === 'string') {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val ?? '';
      }).join(',');
    });

    const csvData = [csvHeader, ...csvRows].join('\n');

    // Set headers for CSV download
    res.setHeader('Content-Disposition', `attachment; filename="brew-history-${new Date().toISOString().split('T')[0]}.csv"`);
    res.setHeader('Content-Type', 'text/csv');
    res.send(csvData);
  } catch (error) {
    console.error('Error exporting brew CSV data:', error);
    res.status(500).json({ error: 'Error exporting data' });
  }
});

module.exports = router;
