const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productname: String,
  size: String,
  product_details: String,
  //categoryId: String,
   categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',   // 🔹 important
      required: true
    },
  //sub_categoryId: String,
   sub_categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subcategory', // 🔹 important
      required: false
    },
  mrp: Number,
  store_price: Number,
  offer: String,
  video_url: String,
  show_warning: Boolean,
  image_url1: String,
  image_url1_public_id: String,
  image_url2: String,
  image_url2_public_id: String,
  image_url3: String,
  image_url3_public_id: String,
  image_url4: String,
  image_url4_public_id: String,
});

module.exports = mongoose.model('Product', productSchema);
