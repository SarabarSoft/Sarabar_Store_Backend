const express = require('express');
const razorpay = require('../config/razorpay');

const router = express.Router();

/**
 * CREATE ORDER
 * POST /api/payment/create-order
 */
router.post('/create-order', async (req, res) => {
  try {
    const { amount } = req.body; // amount in rupees

    const order = await razorpay.orders.create({
      amount: amount * 100, // paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`
    });

    res.status(200).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Order creation failed' });
  }
});


const crypto = require('crypto');

/**
 * VERIFY PAYMENT
 * POST /api/payment/verify
 */
router.post('/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      // ✅ Payment is valid

      // TODO: Save payment/order in DB

      return res.status(200).json({
        message: 'Payment verified successfully',
        success: true
      });
    } else {
      return res.status(400).json({
        message: 'Invalid payment signature',
        success: false
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Payment verification failed'
    });
  }
});


module.exports = router;
