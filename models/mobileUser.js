const mongoose = require('mongoose');

const mobileUserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  mobile: {
    type: String,
    required: true,
    trim: true
  },
  doorNumber: String,
  streetArea: String,
  landmark: String,
  state: String,
  city: String,
  pincode: String
}, { timestamps: true });

module.exports = mongoose.model('MobileUser', mobileUserSchema);
