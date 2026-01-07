const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const mongoose = require('mongoose');
const Subcategory = require("../models/Subcategory");

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
    // 1️⃣ Main product
    const product = await Product.findById(req.params.id)
      .populate('categoryId', 'categoryName imageUrl')
      .populate('sub_categoryId', 'subcategoryName');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // 2️⃣ Related products (FULL DATA)
    const relatedProducts = await Product.find({
      categoryId: product.categoryId._id,
      _id: { $ne: product._id }
    })
      .populate('categoryId', 'categoryName imageUrl')
      .populate('sub_categoryId', 'subcategoryName');

    // 3️⃣ Response
    res.json({
      success: true,
      data: {
        product,
        relatedProducts
      }
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
      .populate('categoryId', 'categoryName')
      .populate('sub_categoryId', 'subcategoryName')
      .sort({ createdAt: -1 });

    // 🔥 FORMAT RESPONSE
    const formattedProducts = products.map(p => ({
      _id: p._id,
      productname: p.productname,
      size: p.size,
      product_details: p.product_details,

      categoryId: p.categoryId?._id || null,
      categoryName: p.categoryId?.categoryName || null,

      sub_categoryId: p.sub_categoryId?._id || null,
      subcategoryName: p.sub_categoryId?.subcategoryName || null,

      mrp: p.mrp,
      store_price: p.store_price,
      offer: p.offer,
      video_url: p.video_url,
      show_warning: p.show_warning,
      image_url1: p.image_url1,
      image_url2: p.image_url2,
      image_url3: p.image_url3,
      image_url4: p.image_url4,
      __v: p.__v
    }));

    res.json({
      success: true,
      count: formattedProducts.length,
      data: formattedProducts
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


/* ======================================================
 GET products by categoryId and sub_categoryId
====================================================== */
router.get("/by-category-subcategory/:categoryId/:subCategoryId", async (req, res) => {
  try {
    const { categoryId, subCategoryId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(categoryId) ||
      !mongoose.Types.ObjectId.isValid(subCategoryId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid categoryId or subCategoryId"
      });
    }

    const products = await Product.find({
      categoryId: new mongoose.Types.ObjectId(categoryId),
      sub_categoryId: new mongoose.Types.ObjectId(subCategoryId)
    })
      .populate("categoryId", "categoryName")
      .populate("sub_categoryId", "subcategoryName")
      .sort({ createdAt: -1 });

    // 🔥 FORMAT RESPONSE
    const formattedProducts = products.map(p => ({
      _id: p._id,
      productname: p.productname,
      size: p.size,
      product_details: p.product_details,

      categoryId: p.categoryId?._id || null,
      categoryName: p.categoryId?.categoryName || null,

      sub_categoryId: p.sub_categoryId?._id || null,
      subcategoryName: p.sub_categoryId?.subcategoryName || null,

      mrp: p.mrp,
      store_price: p.store_price,
      offer: p.offer,
      video_url: p.video_url,
      show_warning: p.show_warning,
      __v: p.__v
    }));

    res.json({
      success: true,
      count: formattedProducts.length,
      data: formattedProducts
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


/* ======================================================
 GET Sub Category by Respective Category
====================================================== */
router.get("/byCategory/:categoryId", async (req, res) => {
  try {
    const { categoryId } = req.params;

    const subcategories = await Subcategory.find({ categoryId });

    res.status(200).json(subcategories);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;