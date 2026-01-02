const express = require("express");
const router = express.Router();
const Category = require("../models/Category");

router.get("/category", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json({
      success: true,
      data: categories,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;