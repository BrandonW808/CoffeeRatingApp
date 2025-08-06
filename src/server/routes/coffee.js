const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Coffee = require('../models/Coffee');
const Brew = require('../models/Brew');
const auth = require('../middleware/auth');

// Get all coffees (user's private + public coffees)
router.get('/', auth, async (req, res) => {
  try {
    const {
      sortBy = 'createdAt',
      order = 'desc',
      limit = 50,
      page = 1,
      search,
      roaster,
      origin,
      onlyMine = false
    } = req.query;

    // Build query
    const query = {};

    // If user is authenticated and wants only their coffees
    if (req.userId && onlyMine === 'true') {
      query.addedBy = req.userId;
    } else {
      // Show public coffees and user's private coffees
      query.$or = [
        { isPublic: true }
      ];
      if (req.userId) {
        query.$or.push({ addedBy: req.userId });
      }
    }

    // Add search filters
    if (search) {
      query.$text = { $search: search };
    }
    if (roaster) {
      query.roaster = new RegExp(roaster, 'i');
    }
    if (origin) {
      query.origin = new RegExp(origin, 'i');
    }

    const coffees = await Coffee.find(query)
      .populate('addedBy', 'username')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Coffee.countDocuments(query);

    // For each coffee, get the user's brew count if authenticated
    if (req.userId) {
      const coffeesWithBrewCount = await Promise.all(
        coffees.map(async (coffee) => {
          const brewCount = await Brew.countDocuments({
            coffee: coffee._id,
            user: req.userId
          });
          return {
            ...coffee.toObject(),
            userBrewCount: brewCount
          };
        })
      );

      res.json({
        coffees: coffeesWithBrewCount,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        total: count
      });
    } else {
      res.json({
        coffees,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        total: count
      });
    }
  } catch (error) {
    console.error('Error fetching coffees:', error);
    res.status(500).json({ error: 'Error fetching coffees' });
  }
});

// Get single coffee by ID
router.get('/:id', async (req, res) => {
  try {
    const coffee = await Coffee.findById(req.params.id)
      .populate('addedBy', 'username');

    if (!coffee) {
      return res.status(404).json({ error: 'Coffee not found' });
    }

    // Check if user has access to this coffee
    if (!coffee.isPublic && (!req.userId || !coffee.addedBy._id.equals(req.userId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get brew statistics for this coffee
    const brewStats = await Brew.aggregate([
      { $match: { coffee: coffee._id, isPublic: true } },
      {
        $group: {
          _id: null,
          totalBrews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          brewMethods: { $addToSet: '$brewMethod' }
        }
      }
    ]);

    const response = {
      ...coffee.toObject(),
      brewStats: brewStats[0] || { totalBrews: 0, averageRating: 0, brewMethods: [] }
    };

    // If user is authenticated, get their brew count
    if (req.userId) {
      const userBrewCount = await Brew.countDocuments({
        coffee: coffee._id,
        user: req.userId
      });
      response.userBrewCount = userBrewCount;
    }

    res.json(response);
  } catch (error) {
    console.error('Error fetching coffee:', error);
    res.status(500).json({ error: 'Error fetching coffee' });
  }
});

// Create new coffee
router.post('/', [
  auth,
  body('name').notEmpty().trim(),
  body('roaster').notEmpty().trim(),
  body('origin').notEmpty().trim(),
  body('roastDate').isISO8601(),
  body('processingMethod').optional().isIn(['Washed', 'Natural', 'Honey', 'Semi-washed', 'Other']),
  body('roastLevel').optional().isIn(['Light', 'Medium-Light', 'Medium', 'Medium-Dark', 'Dark']),
  body('variety').optional().trim(),
  body('altitude').optional().trim(),
  body('flavorNotes').optional().isArray(),
  body('flavorNotes.*').optional().trim(),
  body('price').optional().isFloat({ min: 0 }),
  body('isPublic').optional().isBoolean()
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if similar coffee already exists
    const existingCoffee = await Coffee.findOne({
      name: req.body.name,
      roaster: req.body.roaster,
      origin: req.body.origin,
      $or: [
        { isPublic: true },
        { addedBy: req.userId }
      ]
    });

    if (existingCoffee) {
      return res.status(409).json({
        error: 'Similar coffee already exists',
        existingCoffee: {
          _id: existingCoffee._id,
          name: existingCoffee.name,
          roaster: existingCoffee.roaster,
          origin: existingCoffee.origin
        }
      });
    }

    const coffee = new Coffee({
      ...req.body,
      addedBy: req.userId
    });

    await coffee.save();
    await coffee.populate('addedBy', 'username');

    res.status(201).json(coffee);
  } catch (error) {
    console.error('Error creating coffee:', error);
    res.status(500).json({ error: 'Error creating coffee' });
  }
});

// Update coffee
router.put('/:id', [
  auth,
  body('name').optional().notEmpty().trim(),
  body('roaster').optional().notEmpty().trim(),
  body('origin').optional().notEmpty().trim(),
  body('roastDate').optional().isISO8601(),
  body('processingMethod').optional().isIn(['Washed', 'Natural', 'Honey', 'Semi-washed', 'Other']),
  body('roastLevel').optional().isIn(['Light', 'Medium-Light', 'Medium', 'Medium-Dark', 'Dark']),
  body('variety').optional().trim(),
  body('altitude').optional().trim(),
  body('flavorNotes').optional().isArray(),
  body('price').optional().isFloat({ min: 0 }),
  body('isPublic').optional().isBoolean()
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const coffee = await Coffee.findOneAndUpdate(
      { _id: req.params.id, addedBy: req.userId },
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('addedBy', 'username');

    if (!coffee) {
      return res.status(404).json({ error: 'Coffee not found or access denied' });
    }

    res.json(coffee);
  } catch (error) {
    console.error('Error updating coffee:', error);
    res.status(500).json({ error: 'Error updating coffee' });
  }
});

// Delete coffee (only if no brews reference it)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if coffee exists and belongs to user
    const coffee = await Coffee.findOne({
      _id: req.params.id,
      addedBy: req.userId
    });

    if (!coffee) {
      return res.status(404).json({ error: 'Coffee not found or access denied' });
    }

    // Check if any brews reference this coffee
    const brewCount = await Brew.countDocuments({ coffee: req.params.id });

    if (brewCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete coffee that has associated brews',
        brewCount
      });
    }

    await coffee.deleteOne();

    res.json({ message: 'Coffee deleted successfully' });
  } catch (error) {
    console.error('Error deleting coffee:', error);
    res.status(500).json({ error: 'Error deleting coffee' });
  }
});

// Get popular coffees (most brewed publicly)
router.get('/popular/top', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const popularCoffees = await Brew.aggregate([
      { $match: { isPublic: true } },
      {
        $group: {
          _id: '$coffee',
          brewCount: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      },
      { $sort: { brewCount: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'coffees',
          localField: '_id',
          foreignField: '_id',
          as: 'coffee'
        }
      },
      { $unwind: '$coffee' },
      { $match: { 'coffee.isPublic': true } },
      {
        $project: {
          coffee: 1,
          brewCount: 1,
          averageRating: 1
        }
      }
    ]);

    res.json(popularCoffees);
  } catch (error) {
    console.error('Error fetching popular coffees:', error);
    res.status(500).json({ error: 'Error fetching popular coffees' });
  }
});

// Search for coffees by name, roaster, or origin
router.get('/search/autocomplete', async (req, res) => {
  try {
    const { q, field = 'all' } = req.query;

    if (!q || q.length < 2) {
      return res.json([]);
    }

    const searchRegex = new RegExp(q, 'i');
    const query = { isPublic: true };

    // Add user's private coffees if authenticated
    if (req.userId) {
      query.$or = [
        { isPublic: true },
        { addedBy: req.userId }
      ];
    }

    let projection = {};

    switch (field) {
      case 'name':
        query.name = searchRegex;
        projection = { name: 1 };
        break;
      case 'roaster':
        query.roaster = searchRegex;
        projection = { roaster: 1 };
        break;
      case 'origin':
        query.origin = searchRegex;
        projection = { origin: 1 };
        break;
      default:
        query.$or = [
          { name: searchRegex },
          { roaster: searchRegex },
          { origin: searchRegex }
        ];
        projection = { name: 1, roaster: 1, origin: 1 };
    }

    const results = await Coffee.find(query)
      .select(projection)
      .limit(10)
      .exec();

    res.json(results);
  } catch (error) {
    console.error('Error in autocomplete search:', error);
    res.status(500).json({ error: 'Error searching coffees' });
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
