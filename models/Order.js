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
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
