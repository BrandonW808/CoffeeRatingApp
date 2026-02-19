// server/routes/brews.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Brew = require('../models/Brew');
const Coffee = require('../models/Coffee');
const auth = require('../middleware/auth');
const storage = require('../services/storage');
const { brewImages } = require('../middleware/upload');

console.log('Brew model loaded:', typeof Brew);
console.log('Brew.find exists:', typeof Brew?.find);

if (!Brew) {
  console.error('ERROR: Brew model failed to load!');
}

// Get brew statistics for user
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const userId = new mongoose.Types.ObjectId(req.userId);

    const stats = await Brew.aggregate([
      { $match: { user: userId } },
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
      { $match: { user: userId } },
      { $group: { _id: '$brewMethod', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const temperatureStats = await Brew.aggregate([
      { $match: { user: userId } },
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
      summary: stats[0] || { totalBrews: 0, averageRating: 0 },
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
      return res.status(204).send();
    }

    const fields = [
      'coffeeName', 'roaster', 'origin', 'brewMethod',
      'brewTemperature', 'brewRatio', 'grindSize', 'brewTime',
      'rating', 'notes', 'isPublic', 'createdAt'
    ];

    const csvHeader = fields.join(',');

    const csvRows = brews.map(brew => {
      const row = {
        coffeeName: brew.coffee?.name || '',
        roaster: brew.coffee?.roaster || '',
        origin: brew.coffee?.origin || '',
        brewMethod: brew.brewMethod,
        brewTemperature: brew.brewTemperature,
        brewRatio: brew.brewRatioString || `${brew.brewRatio?.coffee || 0}:${brew.brewRatio?.water || 0}`,
        grindSize: brew.grindSize,
        brewTime: brew.brewTime ? `${Math.floor(brew.brewTime / 60)}:${(brew.brewTime % 60).toString().padStart(2, '0')}` : '',
        rating: brew.rating,
        notes: brew.notes || '',
        isPublic: brew.isPublic ? 'Yes' : 'No',
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

    res.setHeader('Content-Disposition', `attachment; filename="brew-history-${new Date().toISOString().split('T')[0]}.csv"`);
    res.setHeader('Content-Type', 'text/csv');
    res.send(csvData);
  } catch (error) {
    console.error('Error exporting brew CSV data:', error);
    res.status(500).json({ error: 'Error exporting data' });
  }
});

// Get all brews for logged-in user
router.get('/my-brews', auth, async (req, res) => {
  try {
    const {
      sortBy = 'createdAt', order = 'desc', limit = 50,
      page = 1, coffeeId, brewMethod, minRating, maxRating
    } = req.query;

    const query = { user: req.userId };
    if (coffeeId) query.coffee = coffeeId;
    if (brewMethod) query.brewMethod = brewMethod;
    if (minRating || maxRating) {
      query.rating = {};
      if (minRating) query.rating.$gte = parseInt(minRating);
      if (maxRating) query.rating.$lte = parseInt(maxRating);
    }

    const brews = await Brew.find(query)
      .populate('coffee', 'name roaster origin roastDate')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .exec();

    const count = await Brew.countDocuments(query);

    res.json({
      brews: brews || [],
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      total: count
    });
  } catch (error) {
    console.error('Error fetching brews:', error);
    res.status(500).json({ error: 'Error fetching brews' });
  }
});

// Get public brews for a specific coffee
router.get('/coffee/:coffeeId/public', async (req, res) => {
  try {
    const {
      sortBy = 'createdAt', order = 'desc',
      limit = 20, page = 1, brewMethod
    } = req.query;

    const query = { coffee: req.params.coffeeId, isPublic: true };
    if (brewMethod) query.brewMethod = brewMethod;

    const brews = await Brew.find(query)
      .populate('user', 'username avatar')
      .populate('coffee', 'name roaster')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .exec();

    const count = await Brew.countDocuments(query);

    res.json({
      brews: brews || [],
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      total: count
    });
  } catch (error) {
    console.error('Error fetching public brews:', error);
    res.status(500).json({ error: 'Error fetching public brews' });
  }
});

// Get public brews (for discovery)
router.get('/public', async (req, res) => {
  try {
    const {
      sortBy = 'createdAt', order = 'desc', limit = 50,
      page = 1, brewMethod, minRating
    } = req.query;

    const query = { isPublic: true };
    if (brewMethod) query.brewMethod = brewMethod;
    if (minRating) query.rating = { $gte: parseInt(minRating) };

    const brews = await Brew.find(query)
      .populate('coffee', 'name roaster origin roastDate')
      .populate('user', 'username avatar')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .exec();

    const count = await Brew.countDocuments(query);

    res.json({
      brews: brews || [],
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
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
      .populate('user', 'username avatar');

    if (!brew) {
      return res.status(404).json({ error: 'Brew not found' });
    }

    let userId = null;
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (e) { }
    }

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
  body('brewMethod').isIn(['Espresso', 'Pour Over', 'French Press', 'Aeropress', 'Cold Brew', 'Moka Pot', 'Chemex', 'V60', 'Kalita Wave', 'Siphon', 'Drip', 'Other']),
  body('brewTemperature').isFloat({ min: 0, max: 100 }),
  body('brewRatio.coffee').isFloat({ min: 0 }),
  body('brewRatio.water').isFloat({ min: 0 }),
  body('grindSize').isIn(['Extra Fine', 'Fine', 'Medium-Fine', 'Medium', 'Medium-Coarse', 'Coarse', 'Extra Coarse']),
  body('brewTime').optional().isInt({ min: 0 }),
  body('rating').isInt({ min: 1, max: 10 }),
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const coffee = await Coffee.findById(req.body.coffee);
    if (!coffee) {
      return res.status(404).json({ error: 'Coffee not found' });
    }

    if (!coffee.isPublic && !coffee.addedBy.equals(req.userId)) {
      return res.status(403).json({ error: 'Access denied to this coffee' });
    }

    const brew = new Brew({ ...req.body, user: req.userId });
    await brew.save();
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
  body('brewMethod').optional().isIn(['Espresso', 'Pour Over', 'French Press', 'Aeropress', 'Cold Brew', 'Moka Pot', 'Chemex', 'V60', 'Kalita Wave', 'Siphon', 'Drip', 'Other']),
  body('brewTemperature').optional().isFloat({ min: 0, max: 100 }),
  body('brewRatio.coffee').optional().isFloat({ min: 0 }),
  body('brewRatio.water').optional().isFloat({ min: 0 }),
  body('grindSize').optional().isIn(['Extra Fine', 'Fine', 'Medium-Fine', 'Medium', 'Medium-Coarse', 'Coarse', 'Extra Coarse']),
  body('brewTime').optional().isInt({ min: 0 }),
  body('rating').optional().isInt({ min: 1, max: 10 }),
  body('notes').optional().trim().isLength({ max: 1000 }),
  body('flavorNotes').optional().isArray(),
  body('isPublic').optional().isBoolean()
], async (req, res) => {
  try {
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
    const brew = await Brew.findOne({
      _id: req.params.id,
      user: req.userId
    });

    if (!brew) {
      return res.status(404).json({ error: 'Brew not found' });
    }

    // Clean up images on disk
    await storage.removeAll('brews', brew._id.toString());

    await brew.deleteOne();
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

    if (!brew.isPublic && !brew.user.equals(req.userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const userIndex = brew.likes.indexOf(req.userId);
    if (userIndex > -1) {
      brew.likes.splice(userIndex, 1);
    } else {
      brew.likes.push(req.userId);
    }

    await brew.save();
    res.json({ liked: userIndex === -1, likesCount: brew.likes.length });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: 'Error toggling like' });
  }
});

// ── Upload images to a brew ───────────────────────
router.post(
  '/:id/images',
  auth,
  brewImages.array('images', 3),
  async (req, res) => {
    try {
      const brew = await Brew.findOne({
        _id: req.params.id,
        user: req.userId,
      });

      if (!brew) {
        return res.status(404).json({ error: 'Brew not found or access denied' });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No images provided' });
      }

      const totalAfterUpload = brew.images.length + req.files.length;
      if (totalAfterUpload > 5) {
        return res.status(400).json({
          error: `Cannot upload ${req.files.length} images. ` +
            `Brew already has ${brew.images.length}/5 images.`,
        });
      }

      const savedImages = await Promise.all(
        req.files.map((file) =>
          storage.save(
            file.buffer,
            'brews',
            brew._id.toString(),
            file.originalname
          )
        )
      );

      const hasPrimary = brew.images.some((img) => img.isPrimary);

      savedImages.forEach((img, i) => {
        brew.images.push({
          ...img,
          isPrimary: !hasPrimary && i === 0,
        });
      });

      brew.updatedAt = Date.now();
      await brew.save();

      res.status(201).json({
        message: `${savedImages.length} image(s) uploaded`,
        images: brew.images,
      });
    } catch (error) {
      console.error('Error uploading brew images:', error);
      res.status(500).json({ error: 'Error uploading images' });
    }
  }
);

// ── Delete a single image from a brew ─────────────
router.delete('/:id/images/:imageId', auth, async (req, res) => {
  try {
    const brew = await Brew.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!brew) {
      return res.status(404).json({ error: 'Brew not found or access denied' });
    }

    const image = brew.images.id(req.params.imageId);
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    await storage.remove('brews', brew._id.toString(), image.filename);

    const wasPrimary = image.isPrimary;
    brew.images.pull({ _id: req.params.imageId });

    if (wasPrimary && brew.images.length > 0) {
      brew.images[0].isPrimary = true;
    }

    brew.updatedAt = Date.now();
    await brew.save();

    res.json({ message: 'Image deleted', images: brew.images });
  } catch (error) {
    console.error('Error deleting brew image:', error);
    res.status(500).json({ error: 'Error deleting image' });
  }
});

// ── Set a brew image as primary ─────────────────────
router.put('/:id/images/:imageId/primary', auth, async (req, res) => {
  try {
    const brew = await Brew.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!brew) {
      return res.status(404).json({ error: 'Brew not found or access denied' });
    }

    brew.images.forEach((img) => {
      img.isPrimary = img._id.toString() === req.params.imageId;
    });

    brew.updatedAt = Date.now();
    await brew.save();

    res.json({ images: brew.images });
  } catch (error) {
    console.error('Error setting primary brew image:', error);
    res.status(500).json({ error: 'Error setting primary image' });
  }
});

module.exports = router;