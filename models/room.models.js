const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomnumber: {
        type: String,
        required: true
    },
    roomtype: {
        type: String,
        required: true
    },
    roomfloor: {
        type: Number,
        required: true
    },
    roomrupees: {
        type: Number,
        required: true
    },
    roomstatus: {
        type: String,
        required: true
    },
    roomdesc: {
        type: String
        // required nahi rakha
    },
    image: {
        type: String
    }
});

const RoomBooking = mongoose.model('roombook', roomSchema);

module.exports = RoomBooking;