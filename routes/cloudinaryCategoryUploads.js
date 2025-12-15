const express = require('express');
const router = express.Router();
const upload = require('../config/cloudinaryCategoryStorage');

// // Single file upload
router.post('/category_photo', upload.single('image'), async (req, res) => {
  try {
    return res.json({
      success: true,
      imageUrl: req.file.path, // Cloudinary URL
      public_id: req.file.filename
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});



module.exports = router;
