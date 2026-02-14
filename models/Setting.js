const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    marquee_text: String,
    banner_text: String,
    deliveryCharge: {
      type: Number,
      default: 0
    },

    freeDeliveryAbove: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// ❗ MUST export mongoose.model
module.exports = mongoose.model('Setting', settingSchema);
