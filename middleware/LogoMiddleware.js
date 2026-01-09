const multer = require('multer');

const upload = multer({
  limits: {
    fileSize: 1 * 1024 * 1024 // 2MB
  }
});

module.exports = upload;
