const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const mongoose = require('mongoose');

/* ======================================================
   GET ALL PRODUCTS
   GET /api/products
====================================================== */
router.get('/all', async (req, res) => {
  try {
    const products = await Product.find()
      .populate('categoryId', 'categoryName')        // fetch category name
      .populate('sub_categoryId', 'subcategoryName')    // fetch sub category name
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/group-by-category', async (req, res) => {
  try {
    const data = await Product.aggregate([
      // 🔴 FIX STRING → ObjectId
      {
        $addFields: {
          categoryObjId: { $toObjectId: "$categoryId" },
          subCategoryObjId: { $toObjectId: "$sub_categoryId" }
        }
      },

      // 1️⃣ Lookup Category
      {
        $lookup: {
          from: "categories",
          localField: "categoryObjId",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: "$category" },

      // 2️⃣ Lookup Subcategory
      {
        $lookup: {
          from: "subcategories",
          localField: "subCategoryObjId",
          foreignField: "_id",
          as: "subCategory"
        }
      },
      { $unwind: "$subCategory" },

      // 3️⃣ Group
      {
        $group: {
          _id: "$category._id",
          categoryName: { $first: "$category.categoryName" },
          imageUrl: { $first: "$category.imageUrl" },

          products: {
            $push: {
              _id: "$_id",
              productname: "$productname",
              size: "$size",
              product_details: "$product_details",
              mrp: "$mrp",
              store_price: "$store_price",
              offer: "$offer",
              image_url1: "$image_url1",
              image_url2: "$image_url2",
              image_url3: "$image_url3",
              image_url4: "$image_url4",
              subcategoryName: "$subCategory.subcategoryName"
            }
          }
        }
      },

      { $sort: { categoryName: 1 } }
    ]);

    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ======================================================
   GET SINGLE PRODUCT
   GET /api/products/:id
====================================================== */
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('categoryId', 'categoryName imageUrl')
      .populate('sub_categoryId', 'subcategoryName');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


/* ======================================================
   GET PRODUCTS BY CATEGORY ID (MOBILE)
   GET /api/mobile/products/by-category/:categoryId
====================================================== */

router.get('/by-category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid categoryId'
      });
    }

    const products = await Product.find({
      categoryId: new mongoose.Types.ObjectId(categoryId)
    })
      .populate('sub_categoryId', 'subcategoryName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      data: products
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


module.exports = router;