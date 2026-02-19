// server/models/Brew.js
const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    filename: { type: String, required: true },
    originalName: { type: String },
    isPrimary: { type: Boolean, default: false },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const brewSchema = new mongoose.Schema({
  coffee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coffee',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  brewMethod: {
    type: String,
    required: true,
    enum: ['Espresso', 'Pour Over', 'French Press', 'Aeropress', 'Cold Brew', 'Moka Pot', 'Chemex', 'V60', 'Kalita Wave', 'Siphon', 'Drip', 'Other']
  },
  brewTemperature: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
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
  grindSize: {
    type: String,
    enum: ['Extra Fine', 'Fine', 'Medium-Fine', 'Medium', 'Medium-Coarse', 'Coarse', 'Extra Coarse'],
    required: true
  },
  brewTime: {
    type: Number,
    min: 0
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  flavorNotes: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // ── NEW: images array ──────────────────────────────
  images: {
    type: [imageSchema],
    default: [],
    validate: {
      validator: function (arr) {
        return arr.length <= 5;
      },
      message: 'A brew can have at most 5 images',
    },
  },
  extras: {
    bloomTime: Number,
    numberOfPours: Number,
    pressure: Number,
    yield: Number,
    waterType: String,
    grinder: String,
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

brewSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

brewSchema.virtual('brewRatioString').get(function () {
  if (this.brewRatio && this.brewRatio.coffee && this.brewRatio.water) {
    const ratio = this.brewRatio.water / this.brewRatio.coffee;
    return `1:${ratio.toFixed(1)}`;
  }
  return null;
});

brewSchema.virtual('likesCount').get(function () {
  return this.likes ? this.likes.length : 0;
});

// Virtual: get the primary image URL (or first image)
brewSchema.virtual('primaryImage').get(function () {
  if (!this.images || !this.images.length) return null;
  const primary = this.images.find((img) => img.isPrimary);
  if (primary) return primary;
  return this.images[0];
});

brewSchema.methods.isLikedBy = function (userId) {
  return this.likes.some(id => id.equals(userId));
};

brewSchema.index({ user: 1, createdAt: -1 });
brewSchema.index({ coffee: 1, createdAt: -1 });
brewSchema.index({ isPublic: 1, createdAt: -1 });
brewSchema.index({ isPublic: 1, rating: -1 });

brewSchema.set('toJSON', { virtuals: true });
brewSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Brew', brewSchema);