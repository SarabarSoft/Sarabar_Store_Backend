const mongoose = require('mongoose');

const StoreSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true
    },
    storeName: String,
    mobile: String,
    email: String,
    currency: String,
    timezone: String,

    // ✅ Store logo
    logoUrl: {
      type: String,
      default: null
    },
    logoPublicId: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Store', StoreSchema);
