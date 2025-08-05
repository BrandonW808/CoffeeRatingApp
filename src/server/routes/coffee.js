const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Coffee = require('../models/Coffee');
const auth = require('../middleware/auth');

// Get all coffees for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const {
      sortBy = 'createdAt',
      order = 'desc',
      limit = 50,
      page = 1
    } = req.query;

    const coffees = await Coffee.find({ userId: req.userId })
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Coffee.countDocuments({ userId: req.userId });

    res.json({
      coffees,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Error fetching coffees:', error);
    res.status(500).json({ error: 'Error fetching coffee ratings' });
  }
});

// Get single coffee by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const coffee = await Coffee.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!coffee) {
      return res.status(404).json({ error: 'Coffee not found' });
    }

    res.json(coffee);
  } catch (error) {
    console.error('Error fetching coffee:', error);
    res.status(500).json({ error: 'Error fetching coffee' });
  }
});

// Create new coffee rating
router.post('/', [
  auth,
  body('name').notEmpty().trim(),
  body('roaster').notEmpty().trim(),
  body('origin').notEmpty().trim(),
  body('roastDate').isISO8601(),
  body('brewMethod').isIn(['Espresso', 'Pour Over', 'French Press', 'Aeropress', 'Cold Brew', 'Other']),
  body('rating').isInt({ min: 1, max: 5 }),
  body('notes').optional().trim().isLength({ max: 500 }),
  body('price').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const coffee = new Coffee({
      ...req.body,
      userId: req.userId
    });

    await coffee.save();
    res.status(201).json(coffee);
  } catch (error) {
    console.error('Error creating coffee:', error);
    res.status(500).json({ error: 'Error creating coffee rating' });
  }
});

// Update coffee rating
router.put('/:id', [
  auth,
  body('name').optional().notEmpty().trim(),
  body('roaster').optional().notEmpty().trim(),
  body('origin').optional().notEmpty().trim(),
  body('roastDate').optional().isISO8601(),
  body('brewMethod').optional().isIn(['Espresso', 'Pour Over', 'French Press', 'Aeropress', 'Cold Brew', 'Other']),
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('notes').optional().trim().isLength({ max: 500 }),
  body('price').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const coffee = await Coffee.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!coffee) {
      return res.status(404).json({ error: 'Coffee not found' });
    }

    res.json(coffee);
  } catch (error) {
    console.error('Error updating coffee:', error);
    res.status(500).json({ error: 'Error updating coffee rating' });
  }
});

// Delete coffee rating
router.delete('/:id', auth, async (req, res) => {
  try {
    const coffee = await Coffee.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!coffee) {
      return res.status(404).json({ error: 'Coffee not found' });
    }

    res.json({ message: 'Coffee rating deleted successfully' });
  } catch (error) {
    console.error('Error deleting coffee:', error);
    res.status(500).json({ error: 'Error deleting coffee rating' });
  }
});

// Export user's coffee data as JSON
router.get('/export/json', auth, async (req, res) => {
  try {
    const coffees = await Coffee.find({ userId: req.userId })
      .sort({ createdAt: -1 });

    res.json(coffees);
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Error exporting data' });
  }
});

// Export user's coffee data as a CSV
router.get('/export/csv', auth, async (req, res) => {
  try {
    const coffees = await Coffee.find({ userId: req.userId }).sort({ createdAt: -1 });

    if (!Array.isArray(coffees) || coffees.length === 0) {
      return res.status(204).send(); // No Content
    }

    // Define important user-facing fields
    const fields = [
      'name',
      'roaster',
      'origin',
      'brewMethod',
      'roastDate',
      'purchaseDate',
      'rating',
      'price',
      'notes'
    ];

    // Create the CSV header
    const csvHeader = fields.join(',');

    // Convert each coffee entry to CSV row
    const csvRows = coffees.map(coffee => {
      return fields.map(field => {
        let val = coffee[field];

        if (Array.isArray(val)) {
          val = val.join(';');
        } else if (val instanceof Date) {
          val = val.toISOString();
        } else if (typeof val === 'object' && val !== null) {
          val = JSON.stringify(val);
        }

        if (typeof val === 'string') {
          val = `"${val.replace(/"/g, '""')}"`;
        }

        return val ?? '';
      }).join(',');
    });

    const csvData = [csvHeader, ...csvRows].join('\n');

    // Set headers for CSV download
    res.setHeader('Content-Disposition', `attachment; filename="coffee-ratings-${new Date().toISOString().split('T')[0]}.csv"`);
    res.setHeader('Content-Type', 'text/csv');
    res.send(csvData);
  } catch (error) {
    console.error('Error exporting CSV data:', error);
    res.status(500).json({ error: 'Error exporting data' });
  }
});

// Get coffee statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const stats = await Coffee.aggregate([
      { $match: { userId: req.userId } },
      {
        $group: {
          _id: null,
          totalCoffees: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          totalSpent: { $sum: '$price' },
          favoriteBrewMethod: { $first: '$brewMethod' }
        }
      }
    ]);

    const brewMethodCounts = await Coffee.aggregate([
      { $match: { userId: req.userId } },
      { $group: { _id: '$brewMethod', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      summary: stats[0] || {
        totalCoffees: 0,
        averageRating: 0,
        totalSpent: 0
      },
      brewMethodDistribution: brewMethodCounts
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Error fetching statistics' });
  }
});

module.exports = router;
