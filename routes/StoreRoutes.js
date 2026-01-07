const express = require('express');
const router = express.Router();
const Store = require('../models/Store');
const upload = require('../middleware/StoreLogoUpload');
const cloudinary = require('../config/cloudinary');
// const authMiddleware = require('../middleware/auth'); // optional JWT middleware

/**
 * @route   POST /api/store/save
 * @desc    Create or Update Store Information
 * @access  Admin (protected recommended)
 */
router.post('/save', /* authMiddleware, */ async (req, res) => {
  try {
    const { storeName, mobile, email, currency, timezone } = req.body;

    // Validation
    if (!storeName || !mobile || !email) {
      return res.status(400).json({
        success: false,
        message: 'Store name, mobile and email are required'
      });
    }

    const store = await Store.findOneAndUpdate(
      {}, // single-store setup
      {
        storeName,
        mobile,
        email,
        currency: currency || 'INR',
        timezone: timezone || 'Asia/Kolkata'
      },
      {
        new: true,
        upsert: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Store information saved successfully',
      data: store
    });

  } catch (error) {
    console.error('Store save error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route   GET /api/store
 * @desc    Get Store Information
 * @access  Public / Admin
 */
router.get('/', async (req, res) => {
  try {
    const store = await Store.findOne();

    res.status(200).json({
      success: true,
      data: store
    });

  } catch (error) {
    console.error('Store fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


/**
 * @route   PUT /api/store/update
 * @desc    Update Store Information
 * @access  Admin (recommended protected)
 */
router.put('/update', /* authMiddleware, */ async (req, res) => {
  try {
    const { storeName, mobile, email, currency, timezone } = req.body;

    // Validate required fields
    if (!storeName || !mobile || !email) {
      return res.status(400).json({
        success: false,
        message: 'Store name, mobile and email are required'
      });
    }

    // Check if store exists
    const store = await Store.findOne();
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found. Please create store first.'
      });
    }

    // Update store (email is allowed here; lock it if needed)
    store.storeName = storeName;
    store.mobile = mobile;
    store.email = email;
    store.currency = currency || store.currency;
    store.timezone = timezone || store.timezone;

    await store.save();

    res.status(200).json({
      success: true,
      message: 'Store information updated successfully',
      data: store
    });

  } catch (error) {
    console.error('Store update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


/**
 * @route   PUT /api/store/logo
 * @desc    Upload / Update Store Logo
 * @access  Admin
 */

router.put('/logo', (req, res) => {
  upload.single('logo')(req, res, async (err) => {
    if (err) {
      // 🔥 Handle Multer errors here
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Logo image must be less than 5MB'
        });
      }

      return res.status(400).json({
        success: false,
        message: err.message || 'Image upload failed'
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Logo image is required'
        });
      }

      const store = await Store.findOne();
      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }

      // delete old logo
      if (store.logoPublicId) {
        await cloudinary.uploader.destroy(store.logoPublicId);
      }

      // upload new logo
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        {
          folder: 'store/logo',
          transformation: [{ width: 300, height: 300, crop: 'limit' }]
        }
      );

      store.logoUrl = result.secure_url;
      store.logoPublicId = result.public_id;
      await store.save();

      return res.status(200).json({
        success: true,
        message: 'Store logo updated successfully',
        data: {
          logoUrl: store.logoUrl
        }
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  });
});


module.exports = router;
