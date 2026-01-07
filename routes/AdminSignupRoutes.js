const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/AdminSignup');

const router = express.Router();

/**
 * REGISTER
 * POST /api/auth/register
 */
router.post('/admin_register', async (req, res) => {
  try {
    const { name, email, mobile } = req.body;

    // Validate
    if (!name || !email || !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and mobile are required'
      });
    }

    // Check if admin already exists
    const existingUser = await Admin.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Save admin
    const user = new Admin({
      name,
      email,
      mobile
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      data: user
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


/**
 * LOGIN
 * POST /api/auth/login
 */
router.post('/admin_login', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check admin existence
    const user = await Admin.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Admin not registered'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * Update Admin Details
 * PUT /api/admin/update
 */
router.put('/admin_update', async (req, res) => {
  try {
    const { email, name, mobile } = req.body;

    // Validate
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check admin existence
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // ❌ Prevent email update explicitly
    const updateData = {};
    if (name) updateData.name = name;
    if (mobile) updateData.mobile = mobile;

    // Update admin
    const updatedAdmin = await Admin.findOneAndUpdate(
      { email },          // email used only for lookup
      { $set: updateData },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Admin updated successfully',
      data: updatedAdmin
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


module.exports = router;
