const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

/* ======================================================
   PLACE ORDER
   POST /api/orders/place
====================================================== */
router.post('/place', async (req, res) => {
  try {
    const {
      paymentId,
      customer,
      total,
      payment_status,
      order_status
    } = req.body;

    const order = await Order.create({
      paymentId,
      customer,
      total,
      payment_status,
      order_status
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* ======================================================
   GET ALL ORDERS
   GET /api/orders
====================================================== */
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('customer', 'username email phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* ======================================================
   GET ORDER BY ID
   GET /api/orders/:id
====================================================== */
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'username email phone');

    if (!order)
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* ======================================================
   UPDATE ORDER STATUS
   PUT /api/orders/:id
====================================================== */
router.put('/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!order)
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* ======================================================
   DELETE ORDER
   DELETE /api/orders/:id
====================================================== */
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order)
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
