const express = require('express');
const router = express.Router();
const upload = require('../middleware/LogoMiddleware');
const Logo = require('../models/Logo');
const cloudinary = require('../config/cloudinary');

/**
 * POST /api/admin/store/logo
 * Upload / Replace Store Logo
 */
router.post(
  '/brand/logo',
  upload.single('logo'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Logo image is required'
        });
      }

      // get single store doc
      let store = await Logo.findOne();

      if (!store) {
        store = new Logo();
      }

      // delete old logo from cloudinary
      if (store.logoPublicId) {
        await cloudinary.uploader.destroy(store.logoPublicId);
      }

      // upload new logo
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        {
          folder: 'store/logo'
        }
      );

      // replace in mongodb
      store.logoUrl = result.secure_url;
      store.logoPublicId = result.public_id;
      await store.save();

      res.status(200).json({
        success: true,
        message: 'Store logo updated successfully',
        data: {
          logoUrl: store.logoUrl
        }
      });

    } catch (error) {
      console.error('Logo Upload Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

module.exports = router;
