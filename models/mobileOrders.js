const mongoose = require('mongoose');

const mobileOrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MobileUser',
    required: true
  },

  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      productName: String,
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      price: {
        type: Number,
        required: true
      }
    }
  ],

  totalAmount: {
    type: Number,
    required: true
  },

  address: {
    fullName: String,
    mobile: String,
    doorNumber: String,
    streetArea: {
      type: String,
      required: true
    },
    landmark: String,
    state: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true
    }
  },

  paymentMethod: {
    type: String,
    enum: ['ONLINE', 'COD'],
    required: true
  },

  paymentInfo: {
    razorpay_order_id: String,
    razorpay_payment_id: String
  },

  orderStatus: {
    type: String,
    enum: ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
    default: 'PLACED'
  },
  trackingId: {
    type: String,
    default: null
  },
  trackingUrl: {
    type: String,
    default: null
  }


}, { timestamps: true });

module.exports = mongoose.model('MobileOrder', mobileOrderSchema);
