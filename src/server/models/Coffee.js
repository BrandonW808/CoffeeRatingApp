// server/models/Coffee.js
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
  { _id: true } // each image gets its own _id for easy deletion
);

const coffeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  roaster: {
    type: String,
    required: true,
    trim: true,
  },
  origin: {
    type: String,
    required: true,
    trim: true,
  },
  roastDate: {
    type: Date,
    required: true,
  },
  processingMethod: {
    type: String,
    enum: ['Washed', 'Natural', 'Honey', 'Semi-washed', 'Other'],
    default: 'Other',
  },
  roastLevel: {
    type: String,
    enum: ['Light', 'Medium-Light', 'Medium', 'Medium-Dark', 'Dark'],
    default: 'Medium',
  },
  variety: { type: String, trim: true },
  altitude: { type: String, trim: true },
  flavorNotes: [{ type: String, trim: true }],
  price: { type: Number, min: 0 },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isPublic: { type: Boolean, default: false },

  // ── NEW: images array ──────────────────────────────
  images: {
    type: [imageSchema],
    default: [],
    validate: {
      validator: function (arr) {
        return arr.length <= 10; // max 10 images per coffee
      },
      message: 'A coffee can have at most 10 images',
    },
  },

  barcode: { type: String, trim: true, index: true, sparse: true },
  barcodeImage: { type: String, trim: true },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Virtual: get the primary image URL (or first image, or a placeholder)
coffeeSchema.virtual('primaryImage').get(function () {
  if (!this.images || !this.images.length) return null;
  const primary = this.images.find((img) => img.isPrimary);
  if (primary) return primary;
  return this.images[0];
});

// Ensure virtuals show up in JSON
coffeeSchema.set('toJSON', { virtuals: true });
coffeeSchema.set('toObject', { virtuals: true });

coffeeSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

coffeeSchema.index({ addedBy: 1, createdAt: -1 });
coffeeSchema.index({ isPublic: 1, createdAt: -1 });
coffeeSchema.index({ name: 'text', roaster: 'text', origin: 'text' });

module.exports = mongoose.model('Coffee', coffeeSchema);