const express = require("express");
const router = express.Router();
const Subcategory = require("../models/Subcategory");
const Category = require("../models/Category");
const mongoose = require('mongoose');
const { SUBCATEGORY_LIMIT } = require("../config/limits");

// ------------------------------------
// ✅ ADD SUBCATEGORY
// ------------------------------------
router.post("/add", async (req, res) => {
  try {
    const { categoryId, subcategoryName } = req.body;

    if (!categoryId || !subcategoryName) {
      return res.status(400).json({
        message: "categoryId and subcategoryName are required"
      });
    }

    // ✅ Check category exists
    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      return res.status(404).json({ message: "Category not found" });
    }

    // ✅ Check subcategory limit per category
    const subcategoryCount = await Subcategory.countDocuments({ categoryId });

    console.log("Subcategory count for this category:", subcategoryCount);
    
    if (subcategoryCount >= SUBCATEGORY_LIMIT) {
      return res.status(403).json({
        success: false,
        message: `Subcategory limit reached (${SUBCATEGORY_LIMIT}). Please upgrade your plan.`,
      });
    }

    // ✅ Check duplicate
    const exists = await Subcategory.findOne({
      categoryId,
      subcategoryName
    });

    if (exists) {
      return res.status(400).json({
        message: "Subcategory already exists"
      });
    }

    // ✅ Create subcategory
    const subcategory = new Subcategory({
      categoryId: new mongoose.Types.ObjectId(categoryId),
      subcategoryName
    });

    await subcategory.save();

    res.status(200).json({
      message: "Subcategory added successfully",
      data: subcategory
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error
    });
  }
});



// ------------------------------------
// ✅ GET ALL SUBCATEGORIES
// ------------------------------------
router.get("/all", async (req, res) => {
  try {
    const subcategories = await Subcategory.find().populate("categoryId", "categoryName");
    res.status(200).json(subcategories);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});


// ------------------------------------
// ✅ GET SUBCATEGORIES BY CATEGORY ID
// ------------------------------------
router.get("/byCategory/:categoryId", async (req, res) => {
  try {
    const { categoryId } = req.params;

    const subcategories = await Subcategory.find({ categoryId });

    res.status(200).json(subcategories);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});


// ------------------------------------
// ✅ UPDATE SUBCATEGORY
// ------------------------------------
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { subcategoryName, categoryId } = req.body;

    const updated = await Subcategory.findByIdAndUpdate(
      id,
      {
        subcategoryName,
        categoryId
      },
      { new: true } // return updated document
    );

    if (!updated) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    res.status(200).json({
      message: "Subcategory updated successfully",
      data: updated
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});


// ------------------------------------
// ❌ DELETE SUBCATEGORY
// ------------------------------------
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Subcategory.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    res.status(200).json({
      message: "Subcategory deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});


module.exports = router;
