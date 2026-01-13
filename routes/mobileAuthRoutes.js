// routes/mobileAuthRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/mobileUser');
const Logo = require('../models/Logo'); // ✅ ADD THIS

// CHECK EMAIL
router.post('/check-email', async (req, res) => {
  try {
    const { email, fcmToken } = req.body;   // 🔥 added

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const logoDoc = await Logo.findOne({}).lean();

    let user = await User.findOne({ email });

    // ✅ USER EXISTS
    if (user) {

      // 🔔 Update FCM token if provided
      if (fcmToken) {
        user.fcmToken = fcmToken;
        await user.save();
      }

      return res.status(200).json({
        success: true,
        isNewUser: false,
        message: 'User already exists',
        logoUrl: logoDoc?.logoUrl || null,
        data: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          mobile: user.mobile,
          fcmToken: user.fcmToken,   // optional return
          doorNumber: user.doorNumber,
          streetArea: user.streetArea,
          landmark: user.landmark,
          state: user.state,
          city: user.city,
          pincode: user.pincode,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    }

    // 🆕 NEW USER
    return res.status(200).json({
      success: true,
      isNewUser: true,
      logoUrl: logoDoc?.logoUrl || null,
      message: 'New user'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});



// SIGNUP OR LOGIN
// SIGNUP OR LOGIN
router.post('/mobile-signup', async (req, res) => {
  try {
    const {
      fullName,
      email,
      mobile,
      fcmToken,   // 🔥 added
      doorNumber,
      streetArea,
      landmark,
      state,
      city,
      pincode
    } = req.body;

    // 🔴 Mandatory fields validation
    if (!email || !streetArea || !state || !city || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'Email, streetArea, state, city and pincode are required'
      });
    }

    let user = await User.findOne({ email });

    const logoDoc = await Logo.findOne({}).lean();

    // 🔁 UPDATE EXISTING USER
    if (user) {
      user.fullName = fullName ?? user.fullName;
      user.mobile = mobile ?? user.mobile;
      user.doorNumber = doorNumber ?? user.doorNumber;
      user.streetArea = streetArea;
      user.landmark = landmark ?? user.landmark;
      user.state = state;
      user.city = city;
      user.pincode = pincode;

      // 🔔 Update FCM Token (if sent)
      if (fcmToken) {
        user.fcmToken = fcmToken;
      }

      await user.save();

      return res.status(200).json({
        success: true,
        isNewUser: false,
        message: 'User profile updated successfully',
        logoUrl: logoDoc?.logoUrl || null,
        data: user
      });
    }

    // 🆕 CREATE NEW USER
    user = await User.create({
      fullName,
      email,
      mobile,
      fcmToken,   // 🔥 store token on signup
      doorNumber,
      streetArea,
      landmark,
      state,
      city,
      pincode
    });

    return res.status(201).json({
      success: true,
      isNewUser: true,
      message: 'User registered successfully',
      logoUrl: logoDoc?.logoUrl || null,
      data: user
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// UPDATE DELIVERY ADDRESS INFO
router.put('/update-profile', async (req, res) => {
  try {
    const {
      email,
      fullName,
      mobile,
      doorNumber,
      streetArea,
      landmark,
      state,
      city,
      pincode
    } = req.body;

    // 🔴 Mandatory validation
    if (!email || !streetArea || !state || !city || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'Email, streetArea, state, city and pincode are required'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // ✅ Update fields
    user.fullName = fullName ?? user.fullName;
    user.mobile = mobile ?? user.mobile;
    user.doorNumber = doorNumber ?? user.doorNumber;
    user.streetArea = streetArea;
    user.landmark = landmark ?? user.landmark;
    user.state = state;
    user.city = city;
    user.pincode = pincode;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});



module.exports = router;
