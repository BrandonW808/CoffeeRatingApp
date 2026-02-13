const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Coffee = require('../models/Coffee');
const Brew = require('../models/Brew');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// Get all coffees with advanced filtering and sorting
// server/routes/coffees.js - Replace the GET / route
router.get('/', auth, async (req, res) => {
  try {
    console.log(`Getting coffees`);
    const {
      sortBy = 'createdAt',
      order = 'desc',
      limit = 50,
      page = 1,
      search,
      roaster,
      origin,
      onlyMine = false,
      brewMethod,
      minRating,
      maxRating,
      roastLevel,
      processingMethod,
      minPrice,
      maxPrice
    } = req.query;

    // Base query for access control
    const baseQuery = {};
    if (req.userId && onlyMine === 'true') {
      baseQuery.addedBy = new mongoose.Types.ObjectId(req.userId);
    } else {
      baseQuery.$or = [{ isPublic: true }];
      if (req.userId) {
        baseQuery.$or.push({ addedBy: new mongoose.Types.ObjectId(req.userId) });
      }
    }

    // Additional filters
    if (search) {
      baseQuery.$text = { $search: search };
    }
    if (roaster) {
      baseQuery.roaster = new RegExp(roaster, 'i');
    }
    if (origin) {
      baseQuery.origin = new RegExp(origin, 'i');
    }
    if (roastLevel) {
      baseQuery.roastLevel = roastLevel;
    }
    if (processingMethod) {
      baseQuery.processingMethod = processingMethod;
    }
    if (minPrice || maxPrice) {
      baseQuery.price = {};
      if (minPrice) baseQuery.price.$gte = parseFloat(minPrice);
      if (maxPrice) baseQuery.price.$lte = parseFloat(maxPrice);
    }

    // If filtering by brew method, we need aggregation
    if (brewMethod && req.userId) {
      const pipeline = [
        { $match: baseQuery },
        {
          $lookup: {
            from: 'brews',
            let: { coffeeId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$coffee', '$$coffeeId'] },
                  user: new mongoose.Types.ObjectId(req.userId),
                  brewMethod: brewMethod
                }
              }
            ],
            as: 'methodBrews'
          }
        },
        {
          $match: {
            'methodBrews.0': { $exists: true }
          }
        },
        {
          $addFields: {
            userBrewCount: { $size: '$methodBrews' },
            userAvgRating: { $avg: '$methodBrews.rating' }
          }
        }
      ];

      if (minRating) {
        pipeline.push({ $match: { userAvgRating: { $gte: parseFloat(minRating) } } });
      }
      if (maxRating) {
        pipeline.push({ $match: { userAvgRating: { $lte: parseFloat(maxRating) } } });
      }

      let sortStage = {};
      if (sortBy === 'rating' || sortBy === 'avgRating') {
        sortStage = { userAvgRating: order === 'desc' ? -1 : 1, createdAt: -1 };
      } else if (sortBy === 'price') {
        sortStage = { price: order === 'desc' ? -1 : 1, createdAt: -1 };
      } else {
        sortStage = { [sortBy]: order === 'desc' ? -1 : 1 };
      }
      pipeline.push({ $sort: sortStage });

      const countPipeline = [...pipeline, { $count: 'total' }];
      const countResult = await Coffee.aggregate(countPipeline);
      const count = countResult[0]?.total || 0;

      pipeline.push({ $skip: (parseInt(page) - 1) * parseInt(limit) });
      pipeline.push({ $limit: parseInt(limit) });

      pipeline.push({
        $lookup: {
          from: 'users',
          localField: 'addedBy',
          foreignField: '_id',
          as: 'addedByUser'
        }
      });
      pipeline.push({
        $addFields: {
          addedBy: { $arrayElemAt: ['$addedByUser', 0] }
        }
      });
      pipeline.push({
        $project: {
          methodBrews: 0,
          addedByUser: 0,
          'addedBy.password': 0,
          'addedBy.email': 0,
          'addedBy.passwordResetToken': 0,
          'addedBy.passwordResetExpires': 0
        }
      });

      const coffees = await Coffee.aggregate(pipeline);

      return res.json({
        coffees,
        totalPages: Math.ceil(count / parseInt(limit)),
        currentPage: parseInt(page),
        total: count
      });
    }

    // Sorting by rating without brew method filter
    if ((sortBy === 'rating' || sortBy === 'avgRating') && req.userId) {
      const pipeline = [
        { $match: baseQuery },
        {
          $lookup: {
            from: 'brews',
            let: { coffeeId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$coffee', '$$coffeeId'] },
                  user: new mongoose.Types.ObjectId(req.userId)
                }
              }
            ],
            as: 'userBrews'
          }
        },
        {
          $addFields: {
            userBrewCount: { $size: '$userBrews' },
            userAvgRating: {
              $cond: {
                if: { $gt: [{ $size: '$userBrews' }, 0] },
                then: { $avg: '$userBrews.rating' },
                else: null
              }
            }
          }
        }
      ];

      if (minRating) {
        pipeline.push({ $match: { userAvgRating: { $gte: parseFloat(minRating) } } });
      }
      if (maxRating) {
        pipeline.push({ $match: { userAvgRating: { $lte: parseFloat(maxRating) } } });
      }

      // Sort with nulls last
      pipeline.push({
        $addFields: {
          hasRating: { $cond: { if: { $eq: ['$userAvgRating', null] }, then: 0, else: 1 } }
        }
      });

      pipeline.push({
        $sort: {
          hasRating: -1, // Rated items first
          userAvgRating: order === 'desc' ? -1 : 1,
          createdAt: -1
        }
      });

      const countPipeline = [...pipeline, { $count: 'total' }];
      const countResult = await Coffee.aggregate(countPipeline);
      const count = countResult[0]?.total || 0;

      pipeline.push({ $skip: (parseInt(page) - 1) * parseInt(limit) });
      pipeline.push({ $limit: parseInt(limit) });

      pipeline.push({
        $lookup: {
          from: 'users',
          localField: 'addedBy',
          foreignField: '_id',
          as: 'addedByUser'
        }
      });
      pipeline.push({
        $addFields: {
          addedBy: { $arrayElemAt: ['$addedByUser', 0] }
        }
      });
      pipeline.push({
        $project: {
          userBrews: 0,
          addedByUser: 0,
          hasRating: 0,
          'addedBy.password': 0,
          'addedBy.email': 0,
          'addedBy.passwordResetToken': 0,
          'addedBy.passwordResetExpires': 0
        }
      });

      const coffees = await Coffee.aggregate(pipeline);

      return res.json({
        coffees,
        totalPages: Math.ceil(count / parseInt(limit)),
        currentPage: parseInt(page),
        total: count
      });
    }

    // If sorting by rating but no userId, fall back to createdAt
    let effectiveSortBy = sortBy;
    if ((sortBy === 'rating' || sortBy === 'avgRating') && !req.userId) {
      effectiveSortBy = 'createdAt';
    }

    // Standard sorting
    let sortConfig = { [effectiveSortBy]: order === 'desc' ? -1 : 1 };

    const coffees = await Coffee.find(baseQuery)
      .populate('addedBy', 'username')
      .sort(sortConfig)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .exec();

    const count = await Coffee.countDocuments(baseQuery);

    // Add brew stats for each coffee
    let coffeesWithBrewCount = coffees.map((c) => c.toObject());

    if (req.userId && coffees.length > 0) {
      const coffeeIds = coffees.map((c) => c._id);

      const brewStats = await Brew.aggregate([
        {
          $match: {
            coffee: { $in: coffeeIds },
            user: new mongoose.Types.ObjectId(req.userId)
          }
        },
        {
          $group: {
            _id: '$coffee',
            count: { $sum: 1 },
            avgRating: { $avg: '$rating' },
          },
        },
      ]);

      const statsMap = new Map();
      brewStats.forEach((bs) => {
        statsMap.set(bs._id.toString(), { count: bs.count, avgRating: bs.avgRating });
      });

      coffeesWithBrewCount = coffeesWithBrewCount.map((coffee) => {
        const stats = statsMap.get(coffee._id.toString());
        return {
          ...coffee,
          userBrewCount: stats?.count || 0,
          userAvgRating: stats?.avgRating || null,
        };
      });
    }

    res.json({
      coffees: coffeesWithBrewCount,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      total: count,
    });
  } catch (error) {
    console.error('Error fetching coffees:', error);
    res.status(500).json({ error: 'Error fetching coffees' });
  }
});

// Get single coffee by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const coffee = await Coffee.findById(req.params.id)
      .populate('addedBy', 'username');

    if (!coffee) {
      return res.status(404).json({ error: 'Coffee not found' });
    }

    if (!coffee.isPublic && (!req.userId || !coffee.addedBy._id.equals(req.userId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

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

    if (req.userId) {
      const userBrewStats = await Brew.aggregate([
        { $match: { coffee: coffee._id, user: new mongoose.Types.ObjectId(req.userId) } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            avgRating: { $avg: '$rating' }
          }
        }
      ]);
      response.userBrewCount = userBrewStats[0]?.count || 0;
      response.userAvgRating = userBrewStats[0]?.avgRating || null;
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

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

// Delete coffee
router.delete('/:id', auth, async (req, res) => {
  try {
    const coffee = await Coffee.findOne({
      _id: req.params.id,
      addedBy: req.userId
    });

    if (!coffee) {
      return res.status(404).json({ error: 'Coffee not found or access denied' });
    }

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

// Rest of the routes remain the same...
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/barcodes');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `barcode-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

router.get('/barcode/:barcode', auth, async (req, res) => {
  try {
    const { barcode } = req.params;

    const coffee = await Coffee.findOne({
      barcode: barcode,
      $or: [
        { addedBy: req.userId },
        { isPublic: true }
      ]
    }).populate('addedBy', 'username');

    if (!coffee) {
      return res.status(404).json({ error: 'Coffee not found for this barcode' });
    }

    const userBrewCount = await Brew.countDocuments({
      coffee: coffee._id,
      user: req.userId
    });

    res.json({
      ...coffee.toObject(),
      userBrewCount
    });
  } catch (error) {
    console.error('Error looking up barcode:', error);
    res.status(500).json({ error: 'Error looking up barcode' });
  }
});

router.put('/:id/barcode', auth, upload.single('barcodeImage'), async (req, res) => {
  try {
    const { barcode } = req.body;

    if (!barcode) {
      return res.status(400).json({ error: 'Barcode is required' });
    }

    const existingCoffee = await Coffee.findOne({
      barcode: barcode,
      _id: { $ne: req.params.id }
    });

    if (existingCoffee) {
      return res.status(409).json({
        error: 'This barcode is already assigned to another coffee',
        existingCoffee: {
          _id: existingCoffee._id,
          name: existingCoffee.name,
          roaster: existingCoffee.roaster
        }
      });
    }

    const updateData = {
      barcode: barcode,
      updatedAt: Date.now()
    };

    if (req.file) {
      updateData.barcodeImage = `/uploads/barcodes/${req.file.filename}`;
    }

    const coffee = await Coffee.findOneAndUpdate(
      { _id: req.params.id, addedBy: req.userId },
      updateData,
      { new: true, runValidators: true }
    ).populate('addedBy', 'username');

    if (!coffee) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: 'Coffee not found or access denied' });
    }

    res.json(coffee);
  } catch (error) {
    console.error('Error assigning barcode:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Error assigning barcode' });
  }
});

router.delete('/:id/barcode', auth, async (req, res) => {
  try {
    const coffee = await Coffee.findOneAndUpdate(
      { _id: req.params.id, addedBy: req.userId },
      {
        $unset: { barcode: 1, barcodeImage: 1 },
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!coffee) {
      return res.status(404).json({ error: 'Coffee not found or access denied' });
    }

    res.json({ message: 'Barcode removed', coffee });
  } catch (error) {
    console.error('Error removing barcode:', error);
    res.status(500).json({ error: 'Error removing barcode' });
  }
});

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

router.get('/search/autocomplete', async (req, res) => {
  try {
    const { q, field = 'all' } = req.query;

    if (!q || q.length < 2) {
      return res.json([]);
    }

    const searchRegex = new RegExp(q, 'i');
    const query = { isPublic: true };

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

router.get('/export/json', auth, async (req, res) => {
  try {
    const coffees = await Coffee.find({ addedBy: req.userId })
      .sort({ createdAt: -1 });
    res.json(coffees);
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Error exporting data' });
  }
});

router.get('/export/csv', auth, async (req, res) => {
  try {
    const coffees = await Coffee.find({ addedBy: req.userId }).sort({ createdAt: -1 });

    if (!Array.isArray(coffees) || coffees.length === 0) {
      return res.status(204).send();
    }

    const fields = [
      'name',
      'roaster',
      'origin',
      'processingMethod',
      'roastLevel',
      'roastDate',
      'variety',
      'altitude',
      'flavorNotes',
      'price',
      'isPublic',
    ];

    const csvHeader = fields.join(',');

    const csvRows = coffees.map(coffee => {
      return fields.map(field => {
        let val = coffee[field];

        if (Array.isArray(val)) {
          val = val.join(';');
        } else if (val instanceof Date) {
          val = val.toISOString();
        } else if (typeof val === 'boolean') {
          val = val ? 'Yes' : 'No';
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

    res.setHeader('Content-Disposition', `attachment; filename="coffee-export-${new Date().toISOString().split('T')[0]}.csv"`);
    res.setHeader('Content-Type', 'text/csv');
    res.send(csvData);
  } catch (error) {
    console.error('Error exporting CSV data:', error);
    res.status(500).json({ error: 'Error exporting data' });
  }
});

router.get('/stats/summary', auth, async (req, res) => {
  try {
    const stats = await Coffee.aggregate([
      { $match: { addedBy: new mongoose.Types.ObjectId(req.userId) } },
      {
        $group: {
          _id: null,
          totalCoffees: { $sum: 1 },
          totalSpent: { $sum: { $ifNull: ['$price', 0] } },
        }
      }
    ]);

    const brewStats = await Brew.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.userId) } },
      {
        $group: {
          _id: null,
          totalBrews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
        }
      }
    ]);

    const brewMethodCounts = await Brew.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.userId) } },
      { $group: { _id: '$brewMethod', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      summary: {
        totalCoffees: stats[0]?.totalCoffees || 0,
        totalSpent: stats[0]?.totalSpent || 0,
        totalBrews: brewStats[0]?.totalBrews || 0,
        averageRating: brewStats[0]?.averageRating || 0,
      },
      brewMethodDistribution: brewMethodCounts
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Error fetching statistics' });
  }
});

module.exports = router;