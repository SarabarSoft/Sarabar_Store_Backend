const express = require('express');
const router = express.Router();

const Product = require('../models/Product');
const Category = require('../models/Category');
const SubCategory = require('../models/Subcategory');

const authMiddleware = require('../middleware/authtoken');

router.get('/search/products', async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: 'Search keyword is required'
      });
    }

    const regex = new RegExp(keyword, 'i');

    // 1️⃣ Find category & subcategory IDs
    const [categories, subCategories] = await Promise.all([
      Category.find({ categoryName: regex }, { _id: 1, categoryName: 1 }),
      SubCategory.find({ subcategoryName: regex }, { _id: 1, subcategoryName: 1 })
    ]);

    const categoryMap = {};
    categories.forEach(c => categoryMap[c._id.toString()] = c.categoryName);

    const subCategoryMap = {};
    subCategories.forEach(sc => subCategoryMap[sc._id.toString()] = sc.subcategoryName);

    const categoryIds = Object.keys(categoryMap);
    const subCategoryIds = Object.keys(subCategoryMap);

    // 2️⃣ Find products
    const products = await Product.find({
      $or: [
        { productname: regex },
        { product_details: regex },
        { categoryId: { $in: categoryIds } },
        { sub_categoryId: { $in: subCategoryIds } }
      ]
    })
    .populate('categoryId', 'categoryName')
    .populate('sub_categoryId', 'subcategoryName')
    .limit(20)
    .lean(); // IMPORTANT

    // 3️⃣ Flatten response
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
      __v: p.__v
    }));

    res.status(200).json({
      success: true,
      count: formattedProducts.length,
      data: formattedProducts
    });

  } catch (error) {
    console.error('Global Search Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.get('/adminproducts', async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: 'Search keyword is required'
      });
    }

    const regex = new RegExp(keyword, 'i');

    // 1️⃣ Find category & subcategory IDs
    const [categories, subCategories] = await Promise.all([
      Category.find({ categoryName: regex }, { _id: 1, categoryName: 1 }),
      SubCategory.find({ subcategoryName: regex }, { _id: 1, subcategoryName: 1 })
    ]);

    const categoryMap = {};
    categories.forEach(c => categoryMap[c._id.toString()] = c.categoryName);

    const subCategoryMap = {};
    subCategories.forEach(sc => subCategoryMap[sc._id.toString()] = sc.subcategoryName);

    const categoryIds = Object.keys(categoryMap);
    const subCategoryIds = Object.keys(subCategoryMap);

    // 2️⃣ Find products
    const products = await Product.find({
      $or: [
        { productname: regex },
        { product_details: regex },
        { categoryId: { $in: categoryIds } },
        { sub_categoryId: { $in: subCategoryIds } }
      ]
    })
    .populate('categoryId', 'categoryName')
    .populate('sub_categoryId', 'subcategoryName')
    .limit(20)
    .lean(); // IMPORTANT

    // 3️⃣ Flatten response
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
      __v: p.__v
    }));

    res.status(200).json({
      success: true,
      count: formattedProducts.length,
      data: formattedProducts
    });

  } catch (error) {
    console.error('Global Search Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
