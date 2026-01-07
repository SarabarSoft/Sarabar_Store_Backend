const multer = require('multer');

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // ✅ 5MB
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE'), false);
    } else {
      cb(null, true);
    }
  }
});

module.exports = upload;
