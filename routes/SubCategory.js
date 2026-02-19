const express = require("express");
const router = express.Router();
const Subcategory = require("../models/Subcategory");
const Category = require("../models/Category");
const mongoose = require('mongoose');
const { SUBCATEGORY_LIMIT } = require("../config/limits");
const Product = require("../models/Product");
const MobileOrder = require("../models/mobileOrders");

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
    //const subcategoryCount = await Subcategory.countDocuments({ categoryId });
    const subcategoryCount = await Subcategory.countDocuments();

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

// router.delete("/delete/:id", async (req, res) => {
//   try {
//     const { id } = req.params;

//     const deleted = await Subcategory.findByIdAndDelete(id);

//     if (!deleted) {
//       return res.status(404).json({ message: "Subcategory not found" });
//     }

//     res.status(200).json({
//       message: "Subcategory deleted successfully"
//     });

//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// });

router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Find subcategory
    const subcategory = await Subcategory.findById(id);
    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found"
      });
    }

    // 2️⃣ Find products under this subcategory
    const products = await Product.find({ sub_categoryId: id });
    const productIds = products.map(p => p._id);

    if (productIds.length > 0) {

      // 3️⃣ Check if any product is used in orders
      const orderExists = await MobileOrder.exists({
        "items.productId": { $in: productIds }
      });

      if (orderExists) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot delete this subcategory because some products are used in customer orders."
        });
      }
    }

    // 4️⃣ Delete product images + products
    for (const product of products) {

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

    // 5️⃣ Delete subcategory
    await Subcategory.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Subcategory and related products deleted successfully."
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});



module.exports = router;
