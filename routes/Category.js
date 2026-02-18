const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const Category = require("../models/Category");
const { CATEGORY_LIMIT } = require("../config/limits");
const Subcategory = require("../models/Subcategory");
const Product = require("../models/Product");


// Multer setup for file uploads
const storage = multer.diskStorage({});
const upload = multer({ storage });

/**
 * CREATE CATEGORY
 * POST /api/category
 * Body: categoryName (text), image (file)
 */
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { categoryName } = req.body;

    if (!categoryName)
      return res.status(400).json({ message: "categoryName is required" });

    if (!req.file)
      return res.status(400).json({ message: "Image file is required" });

     // ✅ Check category limit
    const categoryCount = await Category.countDocuments();

    if (categoryCount >= CATEGORY_LIMIT) {
      return res.status(403).json({
        success: false,
        message: `Category limit reached (${CATEGORY_LIMIT}). Please upgrade your plan.`,
      });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "categories",
    });

    // Save to DB
    const category = await Category.create({
      categoryName,
      imageUrl: result.secure_url,
    });

    res.json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (err) {
    console.error(err);

    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: `Category "${req.body.categoryName}" already exists`,
      });
    }

    res.status(500).json({ message: "Server error", error: err.message });
  }
});


/**
 * GET ALL CATEGORIES
 * GET /api/category
 */
router.get("/", async (req, res) => {
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

/**
 * GET SINGLE CATEGORY
 * GET /api/category/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/**
 * UPDATE CATEGORY
 * PUT /api/category/:id
 * Body: categoryName (text, optional), image (file, optional)
 */
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { categoryName } = req.body;
    let updateData = {};

    if (categoryName) updateData.categoryName = categoryName;

    if (req.file) {
      // Upload new image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "categories",
      });
      updateData.imageUrl = result.secure_url;
    }

    const category = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!category) return res.status(404).json({ message: "Category not found" });

    res.json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


/**
 * REMOVE CATEGORY IMAGE ONLY
 * DELETE /api/category/:id/image
 */
router.delete("/:id/image", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category)
      return res.status(404).json({ message: "Category not found" });

    if (!category.imageUrl)
      return res.status(400).json({ message: "Category image already removed" });

    // Extract public_id from Cloudinary URL
    const publicId = category.imageUrl
      .split("/")
      .slice(-2)
      .join("/")
      .split(".")[0];

    // Delete image from Cloudinary
    await cloudinary.uploader.destroy(publicId);

    // Remove image from DB
    category.imageUrl = null;
    await category.save();

    res.json({
      success: true,
      message: "Category image removed successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/**
 * DELETE CATEGORY
 * DELETE /api/category/:id
 */
// router.delete("/:id", async (req, res) => {
//   try {
//     const category = await Category.findByIdAndDelete(req.params.id);
//     if (!category) return res.status(404).json({ message: "Category not found" });

//     res.json({
//       success: true,
//       message: "Category deleted successfully",
//       data: category,
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// });
/**
 * DELETE CATEGORY + IMAGE
 * DELETE /api/category/:id
 */
router.delete("/:id", async (req, res) => {
  try {

    const categoryId = req.params.id;

    // 1️⃣ Find category first
    const category = await Category.findById(req.params.id);

    if (!category)
      return res.status(404).json({ message: "Category not found" });

    // 2️⃣ Delete image from Cloudinary (if exists)
    if (category.imageUrl) {
      const publicId = category.imageUrl
        .split("/")
        .slice(-2)
        .join("/")
        .split(".")[0];

      await cloudinary.uploader.destroy(publicId);
    }

    // 3️⃣ Find related subcategories
    const subcategories = await Subcategory.find({ categoryId });
    const subIds = subcategories.map(sub => sub._id);

    // 4️⃣ Delete products linked to category OR subcategories
    await Product.deleteMany({
      $or: [
        { categoryId },
        { sub_categoryId: { $in: subIds } }
      ]
    });

    // 5️⃣ Delete subcategories
    await Subcategory.deleteMany({ categoryId });

    // 6️⃣ Delete category
    await Category.findByIdAndDelete(categoryId);


    res.json({
      success: true,
      message: "Category, related subcategories, and products deleted successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});





module.exports = router;
