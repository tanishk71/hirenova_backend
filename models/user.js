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
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    skills: {
        type: [String], // Array of Strings
        default: []
    },
    preferredLocation: {
        type: String
    },
    // References to other collections will be added later
}, {
    timestamps: true // Adds createdAt and updatedAt fields automatically
});

const User = mongoose.model('User', UserSchema);

module.exports = User;