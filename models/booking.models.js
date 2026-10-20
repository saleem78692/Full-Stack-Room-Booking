const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  moveInDate: {
    type: Date,
    required: true,
  },
  message: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["Pending", "Confirmed", "Cancelled"],
    default: "Pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Booking", bookingSchema);