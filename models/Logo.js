const mongoose = require('mongoose');

const LogoSchema = new mongoose.Schema({
  logoUrl: {
    type: String
  },
  logoPublicId: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Logo', LogoSchema);
