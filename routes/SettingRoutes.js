const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');

/* ======================================================
   CREATE / UPDATE SETTINGS (UPSERT)
   POST /api/settings
====================================================== */


router.post('/', async (req, res) => {
  try {
    const { marquee_text, banner_text } = req.body;

    // Get existing settings (single document)
    let setting = await Setting.findOne();

    // If no settings exist → create
    if (!setting) {
      setting = new Setting({
        marquee_text: marquee_text || '',
        banner_text: banner_text || ''
      });
    } else {
      // Update ONLY if value is provided & not empty
      if (marquee_text !== undefined && marquee_text !== '') {
        setting.marquee_text = marquee_text;
      }

      if (banner_text !== undefined && banner_text !== '') {
        setting.banner_text = banner_text;
      }
    }

    await setting.save();

    res.json({
      success: true,
      message: 'Settings saved successfully',
      data: setting
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* ======================================================
   GET SETTINGS
   GET /api/settings
====================================================== */
router.get('/', async (req, res) => {
  try {
    const setting = await Setting.findOne();

    res.json({
      success: true,
      data: setting
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delivery Cost Setting
router.put('/delivery-settings', async (req, res) => {
  try {
    const { deliveryCharge, freeDeliveryAbove } = req.body;

    let settings = await Setting.findOne();

    if (!settings) {
      settings = new Setting();
    }

    settings.deliveryCharge = deliveryCharge;
    settings.freeDeliveryAbove = freeDeliveryAbove;

    await settings.save();

    res.json({
      success: true,
      message: "Delivery settings updated",
      data: settings
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

module.exports = router;
