const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    marquee_text: String,
    banner_text: String
  },
  { timestamps: true }
);

// ❗ MUST export mongoose.model
module.exports = mongoose.model('Setting', settingSchema);
