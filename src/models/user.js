const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please use a valid email address']
    },
    password: {
        type: String,
        required: true
    },
    isVerified: {
    type: Boolean,
    default: false
    },
    otp: String,
    otpExpires: Date
    // References to other collections will be added later
}, {
    timestamps: true // Adds createdAt and updatedAt fields automatically
});

const User = mongoose.model('User', UserSchema);

module.exports = User;