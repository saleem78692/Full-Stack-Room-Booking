const mongoose = require('mongoose');

const subscribeSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Subscribe', subscribeSchema);
