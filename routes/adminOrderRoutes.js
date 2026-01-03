const express = require('express');
const router = express.Router();
const Order = require('../models/mobileOrders');
const User = require('../models/mobileUser');
const Product = require('../models/Product');

// 🔹 GET ALL ORDERS FOR ADMIN
router.get('/orderlist', async (req, res) => {
  try {
    // Optional query filters
    const { status, fromDate, toDate, userId } = req.query;

    const filter = {};

    if (status) filter.orderStatus = status;
    if (userId) filter.userId = userId;
    if (fromDate || toDate) filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = new Date(fromDate);
    if (toDate) filter.createdAt.$lte = new Date(toDate);

    const orders = await Order.find(filter)
      .populate('userId', 'fullName email mobile')           // user info
      .populate('items.productId', 'productname mrp store_price') // product info
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
