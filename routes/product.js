const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const cloudinary = require("../config/cloudinary");
const multer = require("multer");
const fs = require("fs");


// Multer setup for file uploads
const storage = multer.diskStorage({});
const upload = multer({ storage });

// Add Product (NO images)
router.post('/add', async (req, res) => {
  try {
    const {
      productname,
      size,
      product_details,
      categoryId,
      sub_categoryId,
      mrp,
      store_price,
      offer,
      video_url,
      show_warning
    } = req.body;

    const product = await Product.create({
      productname,
      size,
      product_details,
      categoryId,
      sub_categoryId,
      mrp,
      store_price,
      offer,
      video_url,
      show_warning
    });

    res.status(201).json({
      success: true,
      message: 'Product added successfully',
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
   UPDATE PRODUCT (NO IMAGES)
   PUT /api/products/:id
====================================================== */
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!product)
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Upload product image & update image_url field
router.post(
  '/image',
  upload.single('image'),
  async (req, res) => {
    try {
      const { productId, imageField } = req.body;

      const allowedFields = [
        'image_url1',
        'image_url2',
        'image_url3',
        'image_url4'
      ];

      if (!allowedFields.includes(imageField)) {
        return res.status(400).json({ message: 'Invalid image field' });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      const publicIdField = `${imageField}_public_id`;
      const oldPublicId = product[publicIdField];

      // 🔹 STEP 1: Upload NEW image
      const uploadResult = await cloudinary.uploader.upload(
        req.file.path,
        { folder: 'products' }
      );

      // 🔹 STEP 2: Delete OLD image (only if upload succeeded)
      if (oldPublicId) {
        await cloudinary.uploader.destroy(oldPublicId);
      }

      // 🔹 STEP 3: Update DB
      product[imageField] = uploadResult.secure_url;
      product[publicIdField] = uploadResult.public_id;
      await product.save();

      res.json({
        success: true,
        message: 'Image replaced successfully',
        imageUrl: uploadResult.secure_url
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/* ======================================================
   GET ALL PRODUCTS
   GET /api/products
====================================================== */
router.get('/all', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

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

/* ======================================================
   DELETE PRODUCT IMAGE ONLY
   DELETE /api/products/image
====================================================== */
router.delete('/image', async (req, res) => {
  try {
    const { productId, imageField } = req.body;

    const allowedFields = [
      'image_url1',
      'image_url2',
      'image_url3',
      'image_url4'
    ];

    if (!allowedFields.includes(imageField)) {
      return res.status(400).json({ message: 'Invalid image field' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const publicIdField = `${imageField}_public_id`;
    const publicId = product[publicIdField];

    if (!publicId) {
      return res.status(400).json({ message: 'Image already removed' });
    }

    // 🔥 Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId);

    // 🔥 Clear DB fields
    product[imageField] = null;
    product[publicIdField] = null;
    await product.save();

    res.json({
      success: true,
      message: 'Product image deleted successfully'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ======================================================
   GET SINGLE PRODUCT
   GET /api/products/:id
====================================================== */
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product)
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });

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
   DELETE PRODUCT
   DELETE /api/products/:id
====================================================== */
// router.delete('/:id', async (req, res) => {
//   try {
//     const product = await Product.findByIdAndDelete(req.params.id);

//     if (!product)
//       return res.status(404).json({
//         success: false,
//         message: 'Product not found'
//       });

//     res.json({
//       success: true,
//       message: 'Product deleted successfully'
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// });
/**
 * DELETE PRODUCT + ALL IMAGES
 * DELETE /api/products/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    // 1️⃣ Find product first
    const product = await Product.findById(req.params.id);

    if (!product)
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });

    // 2️⃣ Collect all image public_ids
    const imagePublicIds = [
      product.image_url1_public_id,
      product.image_url2_public_id,
      product.image_url3_public_id,
      product.image_url4_public_id
    ].filter(Boolean); // remove null/undefined

    // 3️⃣ Delete all images from Cloudinary
    if (imagePublicIds.length > 0) {
      await Promise.all(
        imagePublicIds.map(publicId =>
          cloudinary.uploader.destroy(publicId)
        )
      );
    }

    // 4️⃣ Delete product from DB
    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product and images deleted successfully'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


module.exports = router;
