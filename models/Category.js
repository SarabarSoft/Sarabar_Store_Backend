// models/Category.js
const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
  categoryName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  imageUrl: {
    type: String,
    default: null
  },
}, { timestamps: true });

module.exports = mongoose.model("Category", CategorySchema);
