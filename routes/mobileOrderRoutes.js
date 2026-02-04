const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');

const Order = require('../models/mobileOrders');
const User = require('../models/mobileUser');
const sendPush = require("../utils/sendPush");
const Admin = require("../models/AdminSignup");
const Payment = require('../models/Payment');

const authMiddleware = require('../middleware/authtoken');

// 🔑 Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ✅ CREATE RAZORPAY ORDER
// router.post('/create-order', async (req, res) => {
//   try {
//     const { userId, totalAmount } = req.body;

//     if (!userId || !totalAmount) {
//       return res.status(400).json({
//         success: false,
//         message: 'userId and totalAmount are required'
//       });
//     }

//     // Check user exists
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found'
//       });
//     }

//     // Create Razorpay order
//     const options = {
//       amount: totalAmount * 100, // amount in paise
//       currency: 'INR',
//       receipt: `rcpt_${Date.now()}`,
//     };

//     const razorpayOrder = await razorpay.orders.create(options);

//     return res.status(200).json({
//       success: true,
//       message: 'Razorpay order created successfully',
//       data: razorpayOrder
//     });

//   } catch (error) {
//     console.error('Create-order error:', error); // <-- log full error
//     return res.status(500).json({
//       success: false,
//       message: error.message || 'Something went wrong'
//     });
//   }
// });

router.post('/create-order', async (req, res) => {
  try {
    const { userId, totalAmount } = req.body;

    if (!userId || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'userId and totalAmount are required'
      });
    }

    // ✅ Check user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // ✅ Create Razorpay order
    const options = {
      amount: totalAmount * 100, // paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // 🔐 SAVE PAYMENT RECORD (IMPORTANT)
    await Payment.create({
      userId,
      razorpayOrderId: razorpayOrder.id,
      amount: totalAmount,
      status: 'CREATED'
    });

    return res.status(200).json({
      success: true,
      message: 'Razorpay order created successfully',
      data: razorpayOrder
    });

  } catch (error) {
    console.error('Create-order error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong'
    });
  }
});



// Call this AFTER successful Razorpay payment
// router.post('/verify-payment', async (req, res) => {
//   try {
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       userId,
//       items,
//       totalAmount,
//       address
//     } = req.body;

//     // 🔴 Mandatory address fields
//     if (!address?.streetArea || !address?.state || !address?.city || !address?.pincode) {
//       return res.status(400).json({
//         success: false,
//         message: 'Street Area, State, City, and Pincode are mandatory'
//       });
//     }

//     // 🔐 Signature verification
//     const sign = razorpay_order_id + "|" + razorpay_payment_id;
//     const expectedSign = crypto
//       .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
//       .update(sign)
//       .digest('hex');

//     if (expectedSign !== razorpay_signature) {
//       return res.status(400).json({
//         success: false,
//         message: 'Payment verification failed'
//       });
//     }

//     // ✅ Save order only after verification
//     const order = await Order.create({
//       userId,
//       items,
//       totalAmount,
//       address,
//       paymentMethod: 'ONLINE',
//       paymentInfo: {
//         razorpay_order_id,
//         razorpay_payment_id
//       },
//       status: "PLACED"
//     });

//     // ============================
//     // 🔔 SEND PUSH TO CUSTOMER
//     // ============================
//     const user = await User.findById(userId);

//     if (user?.fcmToken) {
//       await sendPush(
//         user.fcmToken,
//         "🎉 Payment Successful!",
//         `Your order #${order._id} has been placed successfully.`,
//         {
//           orderId: order._id.toString(),
//           type: "ORDER_PLACED"
//         }
//       );
//     }

//     // ============================
//     // 🔔 SEND PUSH TO ADMIN
//     // ============================
//     const admins = await Admin.find({ isActive: true, fcmToken: { $ne: null } });

//     for (const admin of admins) {
//       await sendPush(
//         admin.fcmToken,
//         "🛒 New Order Received!",
//         `Order #${order._id} worth ₹${totalAmount} has been placed.`,
//         {
//           orderId: order._id.toString(),
//           type: "NEW_ORDER"
//         }
//       );
//     }

//     return res.status(201).json({
//       success: true,
//       message: 'Payment verified & order placed',
//       data: order
//     });

//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// });

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

    // 🔴 Mandatory address validation
    if (!address?.streetArea || !address?.state || !address?.city || !address?.pincode) {
      return res.status(400).json({
        success: false,
        message: 'Street Area, State, City, and Pincode are mandatory'
      });
    }

    // 🔁 DUPLICATE PAYMENT CHECK
    const existingOrder = await Order.findOne({
      "paymentInfo.razorpay_payment_id": razorpay_payment_id
    });

    if (existingOrder) {
      return res.status(200).json({
        success: true,
        message: 'Payment already processed',
        data: existingOrder
      });
    }

    // 🔐 VERIFY SIGNATURE
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

    // 🔐 VALIDATE AMOUNT FROM DB (ANTI-TAMPERING)
    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
      userId
    });

    if (!payment || payment.amount !== totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Amount mismatch or invalid order'
      });
    }

    // ✅ CREATE ORDER (ONLY AFTER ALL CHECKS)
    const order = await Order.create({
      userId,
      items,
      totalAmount,
      address,
      paymentMethod: 'ONLINE',
      paymentInfo: {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      },
      status: 'PLACED'
    });

    // ✅ UPDATE PAYMENT STATUS
    await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        status: 'PAID'
      }
    );

    // ============================
    // 🔔 PUSH TO CUSTOMER
    // ============================
    const user = await User.findById(userId);
    if (user?.fcmToken) {
      await sendPush(
        user.fcmToken,
        "🎉 Payment Successful!",
        `Your order #${order._id} has been placed successfully.`,
        { orderId: order._id.toString(), type: "ORDER_PLACED" }
      );
    }

    // ============================
    // 🔔 PUSH TO ADMIN
    // ============================
    const admins = await Admin.find({ isActive: true, fcmToken: { $ne: null } });
    for (const admin of admins) {
      await sendPush(
        admin.fcmToken,
        "🛒 New Order Received!",
        `Order #${order._id} worth ₹${totalAmount} has been placed.`,
        { orderId: order._id.toString(), type: "NEW_ORDER" }
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Payment verified & order placed',
      data: order
    });

  } catch (error) {
    console.error('Verify-payment error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});



// PLACE COD ORDER
router.post('/place-cod-order', async (req, res) => {
  try {
    const {
      userId,
      items,
      totalAmount,
      address
    } = req.body;

    // 🔴 BASIC VALIDATIONS
    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'UserId and items are required'
      });
    }

    if (!totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Total amount is required'
      });
    }

    // 🔴 ADDRESS VALIDATION
    if (!address?.streetArea || !address?.state || !address?.city || !address?.pincode) {
      return res.status(400).json({
        success: false,
        message: 'Street Area, State, City and Pincode are required'
      });
    }

    // 🔥 MAP qty → quantity (VERY IMPORTANT)
    const formattedItems = items.map((item, index) => {
      if (!item.productId || !item.price) {
        throw new Error(`Invalid item at index ${index}`);
      }

      const quantity = item.quantity ?? item.qty;

      if (!quantity || quantity < 1) {
        throw new Error(`Quantity missing for item at index ${index}`);
      }

      return {
        productId: item.productId,
        productName: item.productName,
        quantity,
        price: item.price
      };
    });

    // ✅ CREATE COD ORDER
    const order = await Order.create({
      userId,
      items: formattedItems,
      totalAmount,
      address,
      paymentMethod: 'COD',
      orderStatus: 'PLACED',
      trackingId: '',
      trackingUrl: ''
    });

    // ============================
    // 🔔 PUSH TO CUSTOMER
    // ============================
    const user = await User.findById(userId);

    if (user?.fcmToken) {
      await sendPush(
        user.fcmToken,
        "🛒 Order Placed Successfully!",
        `Your COD order #${order._id} has been placed.`,
        {
          orderId: order._id.toString(),
          type: "ORDER_PLACED"
        }
      );
    }

    // ============================
    // 🔔 PUSH TO ADMIN
    // ============================
    const admins = await Admin.find({ fcmToken: { $ne: null } });

    for (const admin of admins) {
      await sendPush(
        admin.fcmToken,
        "🛒 New COD Order!",
        `Order #${order._id} worth ₹${totalAmount} has been placed.`,
        {
          orderId: order._id.toString(),
          type: "NEW_ORDER"
        }
      );
    }

    return res.status(201).json({
      success: true,
      message: 'COD order placed successfully',
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


// GET  ALL ORDERS LIST
// 🔹 GET ALL ORDERS (LATEST FIRST)
router.get('/list', authMiddleware,async (req, res) => {
  try {
    const orders = await Order
      .find({})
      .populate('userId', 'fullName email mobile') // optional
      .sort({ createdAt: -1 }); // 🔥 latest first

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });

  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// 🔹 UPDATE ORDER STATUS WITH PUSH NOTIFICATION
router.put('/update-status', async (req, res) => {
  try {
    const { orderId, orderStatus } = req.body;

    if (!orderId || !orderStatus) {
      return res.status(400).json({
        success: false,
        message: 'orderId and orderStatus are required'
      });
    }

    const allowedStatuses = [
      'PLACED',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
      'RETURNED'
    ];

    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    // 🔹 FETCH ORDER
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // 🔹 UPDATE STATUS
    order.orderStatus = orderStatus;
    await order.save();

    // Temporary fields to confirm push status
    let userPushSent = false;
    let adminPushSentCount = 0;

    // ============================
    // 🔔 PUSH TO CUSTOMER
    // ============================
    const user = await User.findById(order.userId);
    if (user?.fcmToken) {
      try {
        await sendPush(
          user.fcmToken,
          "🛒 Order Status Updated",
          `Your order #${order._id} status is now "${orderStatus}".`,
          {
            orderId: order._id.toString(),
            type: "ORDER_STATUS_UPDATED"
          }
        );
        userPushSent = true;
      } catch (err) {
        console.error('Error sending push to user:', err);
      }
    }

    // ============================
    // 🔔 PUSH TO ADMINS
    // ============================
    const admins = await Admin.find({ fcmToken: { $ne: null } });
    for (const admin of admins) {
      try {
        await sendPush(
          admin.fcmToken,
          "🛒 Order Status Updated",
          `Order #${order._id} has been updated to "${orderStatus}".`,
          {
            orderId: order._id.toString(),
            type: "ORDER_STATUS_UPDATED"
          }
        );
        adminPushSentCount++;
      } catch (err) {
        console.error(`Error sending push to admin ${admin._id}:`, err);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order,
      pushNotification: {
        userPushSent,
        adminPushSentCount
      }
    });

  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET ORDER DETAILS BY ID
// Get order details by orderId
router.get('/:orderId', authMiddleware, async (req, res) => {
  try {
    const order = await Order
      .findById(req.params.orderId)
      .populate('userId', 'fullName email mobile')
      .populate({
        path: 'items.productId',
        select: '-__v -createdAt -updatedAt'
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const formattedOrder = {
      _id: order._id,
      user: order.userId,
      totalAmount: order.totalAmount,
      address: order.address,
      paymentMethod: order.paymentMethod,
      paymentInfo: order.paymentInfo,
      orderStatus: order.orderStatus,

      // 🚚 Tracking details
      trackingId: order.trackingId || null,
      trackingUrl: order.trackingUrl || null,

      createdAt: order.createdAt,
      updatedAt: order.updatedAt,

      items: order.items.map(item => ({
        _id: item._id,
        productInfo: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price
      }))
    };

    return res.status(200).json({
      success: true,
      data: formattedOrder
    });

  } catch (error) {
    console.error('Get order error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// 🔹 UPDATE CANCEL / RETURN DETAILS
router.put('/update-cancel-return', async (req, res) => {
  try {
    const {
      orderId,
      status,          // CANCELLED or RETURNED
      reason,
      actionBy         // CUSTOMER / ADMIN / SYSTEM
    } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({
        success: false,
        message: 'orderId and status are required'
      });
    }

    if (!['CANCELLED', 'RETURNED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be CANCELLED or RETURNED'
      });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        order_status: status,
        cancel_return_reason: reason || '',
        canceled_returned_by: actionBy || 'ADMIN'
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Order ${status.toLowerCase()} successfully`,
      data: order
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 🔹 UPDATE TRACKING DETAILS
router.put('/update-tracking', authMiddleware, async (req, res) => {
  try {
    const { orderId, trackingId, trackingUrl } = req.body;

    if (!orderId || !trackingId) {
      return res.status(400).json({
        success: false,
        message: 'orderId and trackingId are required'
      });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        trackingId: trackingId,
        trackingUrl: trackingUrl || '',
        orderStatus: 'SHIPPED'
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Tracking details updated successfully',
      data: order
    });

  } catch (error) {
    console.error('Update tracking error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET ORDERS BY USER ID
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order
      .find({ userId })
      .populate('userId', 'fullName email mobile')
      .populate({
        path: 'items.productId',
        select: '-__v -createdAt -updatedAt'
      })
      .sort({ createdAt: -1 });

    const formattedOrders = orders.map(order => ({
      _id: order._id,
      orderStatus: order.orderStatus,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      trackingId: order.trackingId || null,
      trackingUrl: order.trackingUrl || null,
      createdAt: order.createdAt,

      items: order.items.map(item => ({
        _id: item._id,
        quantity: item.quantity,
        price: item.price,

        // ✅ FULL PRODUCT INFO (includes images)
        product: item.productId
      }))
    }));

    return res.status(200).json({
      success: true,
      count: formattedOrders.length,
      data: formattedOrders
    });

  } catch (error) {
    console.error('Get user orders error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});



module.exports = router;
