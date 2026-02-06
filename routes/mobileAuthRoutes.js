// routes/mobileAuthRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/mobileUser');
const Store = require('../models/Store'); // ✅ ADD THIS

const authMiddleware = require('../middleware/authtoken');

// CHECK EMAIL
router.post('/check-email', async (req, res) => {
  try {
    const { email, fcmToken } = req.body;

    // ✅ Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // ✅ Fetch store logo (global store)
    const store = await Store.findOne({}).lean();

    // ✅ Check user
    let user = await User.findOne({ email });

    // =========================
    // ✅ USER EXISTS
    // =========================
    if (user) {

      // 🔔 Update FCM token if provided
      if (fcmToken && fcmToken !== user.fcmToken) {
        user.fcmToken = fcmToken;
        await user.save();
      }

      return res.status(200).json({
        success: true,
        isNewUser: false,
        message: 'User already exists',
        logoUrl: store?.logoUrl || null,
        data: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          mobile: user.mobile,
          fcmToken: user.fcmToken,
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

    // =========================
    // 🆕 NEW USER
    // =========================
    return res.status(200).json({
      success: true,
      isNewUser: true,
      message: 'New user',
      logoUrl: store?.logoUrl || null
    });

  } catch (error) {
    console.error('Check email error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});


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

    //const logoDoc = await Logo.findOne({}).lean();

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
        //logoUrl: logoDoc?.logoUrl || null,
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
      //logoUrl: logoDoc?.logoUrl || null,
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


// GET ALL MOBILE USERS (ADMIN)
router.get('/get-customer',authMiddleware, async (req, res) => {
  try {
    const users = await User.find({})
      .sort({ createdAt: -1 })
      .select('-__v')   // optional
      .lean();

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET MOBILE USER BY ID (ADMIN)
// GET CUSTOMER BY ID
router.get('/get-customer/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const user = await User.findById(id).select('-__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
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
