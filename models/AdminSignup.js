const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema(
  {
    storeName: { type: String, required: true },

    email: { type: String, required: true, unique: true, lowercase: true },
    mobile: { type: String, required: true },

    // 🔔 Admin Device Token (for order alerts, etc)
    fcmToken: {
      type: String,
      default: null,
      index: true
    },

    currency: { type: String, default: "INR" },
    timeZone: { type: String, default: "Asia/Kolkata" },

    // 🆕 Store Logo
    logoUrl: { type: String },
    logoPublicId: { type: String },

    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", AdminSchema);
