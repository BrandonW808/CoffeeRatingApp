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
  brewMethod: {
    type: String,
    required: true,
    enum: ['Espresso', 'Pour Over', 'French Press', 'Aeropress', 'Cold Brew', 'Other']
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  price: {
    type: Number,
    min: 0
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

module.exports = mongoose.model('Coffee', coffeeSchema);
