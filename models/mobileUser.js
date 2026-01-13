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

  // 📱 Firebase Cloud Messaging Token
  fcmToken: {
    type: String,
    default: null,
    index: true
  },

  doorNumber: {
    type: String,
    trim: true
  },

  // ✅ REQUIRED FIELDS
  streetArea: {
    type: String,
    required: true,
    trim: true
  },

  landmark: {
    type: String,
    trim: true
  },

  state: {
    type: String,
    required: true,
    trim: true
  },

  city: {
    type: String,
    required: true,
    trim: true
  },

  pincode: {
    type: String,
    required: true,
    trim: true
  }

}, { timestamps: true });

module.exports = mongoose.model('MobileUser', mobileUserSchema);
