
const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    logo: {
        type: String,
        default: 'logo.png'
    },
    address: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        default: ''
    },
    mapLink: {
        type: String,
        default: ''
    },
    facebook: {
        type: String,
        default: ''
    },
    instagram: {
        type: String,
        default: ''
    },
    linkedin: {
        type: String,
        default: ''
    },
    twitter: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Setting', settingSchema);
