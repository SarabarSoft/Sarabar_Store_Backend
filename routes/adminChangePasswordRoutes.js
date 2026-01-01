const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authtoken");
const changeAdminPassword = require("../Controller/changeAdminPassword");

router.put("/change-password", authMiddleware, changeAdminPassword);

module.exports = router;
