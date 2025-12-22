const mongoose = require('mongoose');

const PaymentTransactionSchema = new mongoose.Schema({
  // Link to your existing Order collection
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order', // keep your existing Order model
    required: true
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Razorpay identifiers
  razorpay_order_id: {
    type: String,
    required: true,
    index: true
  },

  razorpay_payment_id: {
    type: String,
    unique: true,
    sparse: true
  },

  razorpay_signature: {
    type: String
  },

  amount: {
    type: Number, // rupees
    required: true
  },

  currency: {
    type: String,
    default: 'INR'
  },

  paymentMethod: {
    type: String // card / upi / wallet / netbanking
  },

  status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED'],
    default: 'PENDING'
  },

  failureReason: {
    type: String
  },

  provider: {
    type: String,
    default: 'RAZORPAY'
  }

}, { timestamps: true });

module.exports = mongoose.model('PaymentTransaction', PaymentTransactionSchema);
