const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');

const Order = require('../models/mobileOrders');
const User = require('../models/mobileUser');
const sendPush = require("../utils/sendPush");
const Admin = require("../models/AdminSignup");

// 🔑 Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ✅ CREATE RAZORPAY ORDER
router.post('/create-order', async (req, res) => {
  try {
    const { userId, totalAmount } = req.body;

    if (!userId || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'userId and totalAmount are required'
      });
    }

    // Check user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create Razorpay order
    const options = {
      amount: totalAmount * 100, // amount in paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    return res.status(200).json({
      success: true,
      message: 'Razorpay order created successfully',
      data: razorpayOrder
    });

  } catch (error) {
    console.error('Create-order error:', error); // <-- log full error
    return res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong'
    });
  }
});

// 🔹 VERIFY PAYMENT & SAVE ORDER
// Call this AFTER successful Razorpay payment
router.post('/verify-payment', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      items,
      totalAmount,
      address
    } = req.body;

    // 🔴 Mandatory address fields
    if (!address?.streetArea || !address?.state || !address?.city || !address?.pincode) {
      return res.status(400).json({
        success: false,
        message: 'Street Area, State, City, and Pincode are mandatory'
      });
    }

    // 🔐 Signature verification
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest('hex');

    if (expectedSign !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // ✅ Save order only after verification
    const order = await Order.create({
      userId,
      items,
      totalAmount,
      address,
      paymentMethod: 'ONLINE',
      paymentInfo: {
        razorpay_order_id,
        razorpay_payment_id
      },
      status: "PLACED"
    });

    // ============================
    // 🔔 SEND PUSH TO CUSTOMER
    // ============================
    const user = await User.findById(userId);

    if (user?.fcmToken) {
      await sendPush(
        user.fcmToken,
        "🎉 Payment Successful!",
        `Your order #${order._id} has been placed successfully.`,
        {
          orderId: order._id.toString(),
          type: "ORDER_PLACED"
        }
      );
    }

    // ============================
    // 🔔 SEND PUSH TO ADMIN
    // ============================
    const admins = await Admin.find({ isActive: true, fcmToken: { $ne: null } });

    for (const admin of admins) {
      await sendPush(
        admin.fcmToken,
        "🛒 New Order Received!",
        `Order #${order._id} worth ₹${totalAmount} has been placed.`,
        {
          orderId: order._id.toString(),
          type: "NEW_ORDER"
        }
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Payment verified & order placed',
      data: order
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 🔔 TEST PUSH NOTIFICATION (User + Admin)
router.post("/test-push", async (req, res) => {
  try {
    const { userId } = req.body;

    // 📲 CUSTOMER
    const user = await User.findById(userId);

    if (!user || !user.fcmToken) {
      return res.status(404).json({
        success: false,
        message: "User or FCM token not found"
      });
    }

    await sendPush(
      user.fcmToken,
      "🔔 Test Notification",
      "Push notification is working for customer!",
      { type: "TEST_USER_PUSH" }
    );

    // 🛒 ADMIN
    const admins = await Admin.find({ isActive: true, fcmToken: { $ne: null } });

    for (const admin of admins) {
      await sendPush(
        admin.fcmToken,
        "🔔 Test Notification",
        "Push notification is working for admin!",
        { type: "TEST_ADMIN_PUSH" }
      );
    }

    return res.json({
      success: true,
      message: "Push notification sent to user & admin successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


module.exports = router;
