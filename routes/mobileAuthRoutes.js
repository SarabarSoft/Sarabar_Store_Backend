// routes/mobileAuthRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/mobileUser');

// CHECK EMAIL
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });

    // ✅ USER EXISTS
    if (user) {
      return res.status(200).json({
        success: true,
        isNewUser: false,
        message: 'User already exists',
        data: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          mobile: user.mobile
        }
      });
    }

    // ✅ NEW USER
    return res.status(200).json({
      success: true,
      isNewUser: true,
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
router.post('/mobile-signup', async (req, res) => {
  try {
    const { fullName, email, mobile } = req.body;

    if (!fullName || !email || !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email and mobile are required'
      });
    }

    // 🔍 Check again (important for safety)
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(200).json({
        success: true,
        isNewUser: false,
        message: 'User already exists',
        data: existingUser
      });
    }

    // ✅ Create new user
    const user = await User.create({
      fullName,
      email,
      mobile
    });

    return res.status(201).json({
      success: true,
      isNewUser: true,
      message: 'User registered successfully',
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
