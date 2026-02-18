const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const Category = require("../models/Category");
const { CATEGORY_LIMIT } = require("../config/limits");
const Subcategory = require("../models/Subcategory");
const Product = require("../models/Product");
const MobileOrder = require("../models/mobileOrders");

const mongoose = require("mongoose");

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

// router.delete("/:id", async (req, res) => {
//   try {

//     const categoryId = req.params.id;

//     // 1️⃣ Find category first
//     const category = await Category.findById(req.params.id);

//     if (!category)
//       return res.status(404).json({ message: "Category not found" });

//     // 2️⃣ Delete image from Cloudinary (if exists)
//     if (category.imageUrl) {
//       const publicId = category.imageUrl
//         .split("/")
//         .slice(-2)
//         .join("/")
//         .split(".")[0];

//       await cloudinary.uploader.destroy(publicId);
//     }

//     // 3️⃣ Find related subcategories
//     const subcategories = await Subcategory.find({ categoryId });
//     const subIds = subcategories.map(sub => sub._id);

//     // 4️⃣ Find products to clean Cloudinary images
//     const products = await Product.find({
//       $or: [
//         { categoryId },
//         { sub_categoryId: { $in: subIds } }
//       ]
//     });

//     // 5️⃣ Delete product images from Cloudinary
//     for (const product of products) {
//       const images = [
//         product.image_url1_public_id,
//         product.image_url2_public_id,
//         product.image_url3_public_id,
//         product.image_url4_public_id
//       ];

//       for (const publicId of images) {
//         if (publicId) {
//           await cloudinary.uploader.destroy(publicId);
//         }
//       }
//     }

//     // 4️⃣ Delete products linked to category OR subcategories
//     await Product.deleteMany({
//       $or: [
//         { categoryId },
//         { sub_categoryId: { $in: subIds } }
//       ]
//     });

//     // 5️⃣ Delete subcategories
//     await Subcategory.deleteMany({ categoryId });

//     // 6️⃣ Delete category
//     await Category.findByIdAndDelete(categoryId);


//     res.json({
//       success: true,
//       message: "Category, related subcategories, and products deleted successfully",
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// });

// router.delete("/:id", async (req, res) => {
//   try {
//     const mongoose = require("mongoose");

//     const categoryId = req.params.id;

//     // 1️⃣ Find category
//     const category = await Category.findById(categoryId);
//     if (!category) {
//       return res.status(404).json({
//         success: false,
//         message: "Category not found",
//       });
//     }

//     // 2️⃣ Find subcategories
//     const subcategories = await Subcategory.find({ categoryId });
//     const subIds = subcategories.map(sub => sub._id);

//     // 3️⃣ Find products under category/subcategories
//     const products = await Product.find({
//       $or: [
//         { categoryId },
//         { sub_categoryId: { $in: subIds } }
//       ]
//     });

//     const productIds = products.map(p => p._id);

//     // 🚨 4️⃣ CHECK MOBILE ORDERS (CRITICAL SAFETY)
//     if (productIds.length > 0) {

//       const orderExists = await MobileOrder.exists({
//         "items.productId": { $in: productIds }
//       });

//       console.log("Order check result:", orderExists);

//       if (orderExists) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Cannot delete category — products already exist in orders.",
//         });
//       }
//     }

//     // ✅ 5️⃣ Delete category image from Cloudinary
//     if (category.imageUrl) {
//       const publicId = category.imageUrl
//         .split("/")
//         .slice(-2)
//         .join("/")
//         .split(".")[0];

//       await cloudinary.uploader.destroy(publicId);
//     }

//     // ✅ 6️⃣ Delete product images from Cloudinary
//     for (const product of products) {
//       const images = [
//         product.image_url1_public_id,
//         product.image_url2_public_id,
//         product.image_url3_public_id,
//         product.image_url4_public_id
//       ];

//       for (const publicId of images) {
//         if (publicId) {
//           await cloudinary.uploader.destroy(publicId);
//         }
//       }
//     }

//     // ✅ 7️⃣ Delete DB records
//     await Product.deleteMany({
//       $or: [
//         { categoryId },
//         { sub_categoryId: { $in: subIds } }
//       ]
//     });

//     await Subcategory.deleteMany({ categoryId });

//     await Category.findByIdAndDelete(categoryId);

//     // 🎉 SUCCESS
//     res.json({
//       success: true,
//       message:
//         "Category, related subcategories, and products deleted successfully",
//     });

//   } catch (err) {
//     console.error("Delete category error:", err);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: err.message,
//     });
//   }
// });

router.delete("/:id", async (req, res) => {
  try {
    const categoryId = req.params.id;

    // 1️⃣ Find category
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // 2️⃣ Find subcategories
    const subcategories = await Subcategory.find({ categoryId });
    const subIds = subcategories.map(sub => sub._id);

    // 3️⃣ Find products
    const products = await Product.find({
      $or: [
        { categoryId },
        { sub_categoryId: { $in: subIds } }
      ]
    });

    const productIds = products.map(p => p._id);

    // 4️⃣ Find products used in orders
    const usedOrders = await MobileOrder.find({
      "items.productId": { $in: productIds }
    }).select("items.productId");

    const usedProductIds = new Set();

    usedOrders.forEach(order => {
      order.items.forEach(item => {
        usedProductIds.add(item.productId.toString());
      });
    });

    // 5️⃣ Split products
    const safeProducts = products.filter(
      p => !usedProductIds.has(p._id.toString())
    );

    // ✅ DELETE SAFE PRODUCTS
    for (const product of safeProducts) {

      const images = [
        product.image_url1_public_id,
        product.image_url2_public_id,
        product.image_url3_public_id,
        product.image_url4_public_id
      ];

      for (const publicId of images) {
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }

      await Product.findByIdAndDelete(product._id);
    }

    // 6️⃣ Delete empty subcategories
    for (const sub of subcategories) {
      const remaining = await Product.countDocuments({
        sub_categoryId: sub._id
      });

      if (remaining === 0) {
        await Subcategory.findByIdAndDelete(sub._id);
      }
    }

    // 7️⃣ Delete category if no products remain
    const remainingProducts = await Product.countDocuments({
      categoryId
    });

    if (remainingProducts === 0) {

      if (category.imageUrl) {
        const publicId = category.imageUrl
          .split("/")
          .slice(-2)
          .join("/")
          .split(".")[0];

        await cloudinary.uploader.destroy(publicId);
      }

      await Category.findByIdAndDelete(categoryId);

      return res.json({
        success: true,
        message:
          "Category and unused products deleted. Ordered products preserved.",
      });
    }

    // partial delete result
    res.json({
      success: true,
      message:
        "Unused products deleted. Products used in orders were preserved.",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});



module.exports = router;
