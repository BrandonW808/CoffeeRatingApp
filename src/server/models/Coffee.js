const mongoose = require('mongoose');

const coffeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  roaster: {
    type: String,
    required: true,
    trim: true
  },
  origin: {
    type: String,
    required: true,
    trim: true
  },
  roastDate: {
    type: Date,
    required: true
  },
  // Coffee bean processing method
  processingMethod: {
    type: String,
    enum: ['Washed', 'Natural', 'Honey', 'Semi-washed', 'Other'],
    default: 'Other'
  },
  // Roast level
  roastLevel: {
    type: String,
    enum: ['Light', 'Medium-Light', 'Medium', 'Medium-Dark', 'Dark'],
    default: 'Medium'
  },
  // Bean variety/cultivar
  variety: {
    type: String,
    trim: true
  },
  // Altitude where coffee was grown
  altitude: {
    type: String,
    trim: true
  },
  // Flavor notes from roaster
  flavorNotes: [{
    type: String,
    trim: true
  }],
  price: {
    type: Number,
    min: 0
  },
  // User who added this coffee
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Whether this coffee is publicly visible
  isPublic: {
    type: Boolean,
    default: false
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
coffeeSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient querying
coffeeSchema.index({ addedBy: 1, createdAt: -1 });
coffeeSchema.index({ isPublic: 1, createdAt: -1 });
coffeeSchema.index({ name: 'text', roaster: 'text', origin: 'text' });

module.exports = mongoose.model('Coffee', coffeeSchema);
