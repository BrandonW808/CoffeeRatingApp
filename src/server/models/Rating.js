const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    coffee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coffee',
        required: true
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
ratingSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Rating', ratingSchema);
