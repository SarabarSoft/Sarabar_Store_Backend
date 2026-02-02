const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    total: {
      type: Number,
      required: true
    },
    payment_status: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED'],
      default: 'PENDING'
    },
    order_status: {
      type: String,
      enum: ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      default: 'PLACED'
    },
    // 🔴 Cancel / Return details
    cancel_return_reason: {
      type: String
    },

    canceled_returned_by: {
      type: String,
      enum: ['CUSTOMER', 'ADMIN', 'SYSTEM']
    },

    // 🚚 Tracking details
    tracking_id: {
      type: String
    },

    tracking_url: {
      type: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
