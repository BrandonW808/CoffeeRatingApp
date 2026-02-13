const mongoose = require('mongoose');

const brewSchema = new mongoose.Schema({
  // Reference to the coffee being brewed
  coffee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coffee',
    required: true
  },
  // User who created this brew
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Brew method used
  brewMethod: {
    type: String,
    required: true,
    enum: ['Espresso', 'Pour Over', 'French Press', 'Aeropress', 'Cold Brew', 'Moka Pot', 'Chemex', 'V60', 'Kalita Wave', 'Siphon', 'Other']
  },
  // Water temperature in Celsius
  brewTemperature: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  // Coffee to water ratio (e.g., "1:15" means 1g coffee to 15g water)
  brewRatio: {
    coffee: {
      type: Number,
      required: true,
      min: 0
    },
    water: {
      type: Number,
      required: true,
      min: 0
    }
  },
  // Grind size
  grindSize: {
    type: String,
    enum: ['Extra Fine', 'Fine', 'Medium-Fine', 'Medium', 'Medium-Coarse', 'Coarse', 'Extra Coarse'],
    required: true
  },
  // Total brew time in seconds
  brewTime: {
    type: Number,
    min: 0
  },
  // Rating for this specific brew
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  // Tasting notes for this brew
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  // Detected flavor notes in this brew
  flavorNotes: [{
    type: String,
    trim: true
  }],
  // Whether this brew is shared publicly
  isPublic: {
    type: Boolean,
    default: false
  },
  // Users who have liked this brew
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Additional brew parameters
  extras: {
    // Pre-infusion/bloom time in seconds
    bloomTime: Number,
    // Number of pours (for pour over methods)
    numberOfPours: Number,
    // Pressure in bars (for espresso)
    pressure: Number,
    // Yield in grams (for espresso)
    yield: Number,
    // Water type used
    waterType: String,
    // Grinder used
    grinder: String,
    // Any modifications to the brew method
    modifications: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
brewSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for brew ratio as string (e.g., "1:15")
brewSchema.virtual('brewRatioString').get(function () {
  if (this.brewRatio && this.brewRatio.coffee && this.brewRatio.water) {
    const ratio = this.brewRatio.water / this.brewRatio.coffee;
    return `1:${ratio.toFixed(1)}`;
  }
  return null;
});

// Virtual for likes count
brewSchema.virtual('likesCount').get(function () {
  return this.likes ? this.likes.length : 0;
});

// Method to check if a user has liked this brew
brewSchema.methods.isLikedBy = function (userId) {
  return this.likes.some(id => id.equals(userId));
};

// Index for efficient querying
brewSchema.index({ user: 1, createdAt: -1 });
brewSchema.index({ coffee: 1, createdAt: -1 });
brewSchema.index({ isPublic: 1, createdAt: -1 });
brewSchema.index({ isPublic: 1, rating: -1 });

// Ensure virtuals are included in JSON
brewSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Brew', brewSchema);
