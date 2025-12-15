const express = require('express');
const router = express.Router();
const User = require('../models/Customer');

/* ======================================================
   REGISTER USER
   POST /api/users/register
====================================================== */
router.post('/register', async (req, res) => {
  try {
    const { username, email, phone, address, pincode, active } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const user = await User.create({
      username,
      email,
      phone,
      address,
      pincode,
      active
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* ======================================================
   GET ALL USERS
   GET /api/users
====================================================== */
router.get('/', async (req, res) => {
  try {
    const users = await User.find();

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* ======================================================
   GET SINGLE USER
   GET /api/users/:id
====================================================== */
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user)
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* ======================================================
   UPDATE USER
   PUT /api/users/:id
====================================================== */
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!user)
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* ======================================================
   DELETE USER
   DELETE /api/users/:id
====================================================== */
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user)
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
