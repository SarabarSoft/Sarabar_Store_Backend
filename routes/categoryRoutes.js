const express = require("express");
const router = express.Router();
const Category = require("../models/Category");

// ----------------------
// ADD CATEGORY
// ----------------------
router.post("/add", async (req, res) => {
  try {
    let { categoryName, imageUrl } = req.body;

    if (!categoryName || categoryName.trim() === "") {
      return res.status(400).json({ message: "categoryName is required" });
    }

    categoryName = categoryName.trim();

    const exists = await Category.findOne({ categoryName });
    if (exists) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = new Category({ categoryName, imageUrl });
    await category.save();

    return res.status(201).json({
      message: "Category added successfully",
      data: category
    });

  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
});

// ----------------------
// GET ALL CATEGORIES
// ----------------------
router.get("/all", async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    return res.status(200).json(categories);
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
});

// ----------------------
// UPDATE CATEGORY
// ----------------------
router.put("/:id", async (req, res) => {
  try {
    const { categoryName, imageUrl } = req.body;

    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      { categoryName, imageUrl },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json({
      message: "Category updated successfully",
      data: updated
    });

  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ----------------------
// DELETE CATEGORY
// ----------------------
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Category not found" });
    }

    // 2️⃣ cascade delete subcategories
    await Subcategory.deleteMany({ categoryId });

    return res.status(200).json({
      message: "Category and related subcategories deleted successfully"
    });

  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Export router
module.exports = router;
