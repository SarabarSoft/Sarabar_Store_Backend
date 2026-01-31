const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  razorpayOrderId: {
    type: String,
    required: true,
    unique: true
  },
  razorpayPaymentId: String,
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['CREATED', 'PAID', 'FAILED'],
    default: 'CREATED'
  }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
