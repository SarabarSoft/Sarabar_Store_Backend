const multer = require("multer");
const storage = multer.diskStorage({});
const upload = multer({ storage });

const express = require('express');
const router = express.Router();
const cloudinary = require("../config/cloudinary");
const Admin = require('../models/AdminSignup');
const jwt = require("jsonwebtoken");

router.post("/check-admin-email", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const admin = await Admin.findOne({ email });

    // ✅ Existing admin → Generate token
    if (admin) {
      const token = jwt.sign(
        { adminId: admin._id, email: admin.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        success: true,
        isNewUser: false,
        message: "Store found",
        token,   // 🔐 JWT added here
        data: {
          id: admin._id,
          storeName: admin.storeName,
          email: admin.email,
          mobile: admin.mobile,
          currency: admin.currency,
          timeZone: admin.timeZone,
          logoUrl: admin.logoUrl,
          createdAt: admin.createdAt
        }
      });
    }

    // 🚫 Another admin already registered
    const existingAdmin = await Admin.findOne({});
    if (existingAdmin) {
      return res.status(403).json({
        success: false,
        isNewUser: false,
        message:
          "This store is already registered with another email. Please contact your development team to use the email that was registered earlier."
      });
    }

    // 🆕 No admin → allow signup
    return res.status(200).json({
      success: true,
      isNewUser: true,
      message: "New store – please complete registration"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});




router.post("/signup-new", upload.single("logo"), async (req, res) => {
  try {
    const { storeName, email, mobile, currency, timeZone, fcmToken } = req.body; // 🔔 added

    let admin = await Admin.findOne({ email });

    let logoUrl = null;
    let logoPublicId = null;

    // If logo uploaded
    if (req.file) {
      // If store already exists, delete old logo first
      if (admin && admin.logoPublicId) {
        await cloudinary.uploader.destroy(admin.logoPublicId);
      }

      // Upload new logo
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "stores"
      });

      logoUrl = result.secure_url;
      logoPublicId = result.public_id;
    }

    // 🆕 New Store
    if (!admin) {
      admin = await Admin.create({
        storeName,
        email,
        mobile,
        currency,
        timeZone,
        fcmToken,     // 🔔 save token
        logoUrl,
        logoPublicId
      });

      return res.status(201).json({
        success: true,
        isNewUser: true,
        message: "Store registered successfully",
        data: admin
      });
    }

    // 🔁 Existing Store → Update
    admin.storeName = storeName ?? admin.storeName;
    admin.mobile = mobile ?? admin.mobile;
    admin.currency = currency ?? admin.currency;
    admin.timeZone = timeZone ?? admin.timeZone;

    // 🔔 Update FCM token
    if (fcmToken) {
      admin.fcmToken = fcmToken;
    }

    if (logoUrl) {
      admin.logoUrl = logoUrl;
      admin.logoPublicId = logoPublicId;
    }

    await admin.save();

    return res.status(200).json({
      success: true,
      isNewUser: false,
      message: "Store updated successfully",
      data: admin
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});



router.put("/update-store/:adminId", upload.single("logo"), async (req, res) => {
  try {
    const { adminId } = req.params;
    const { storeName, mobile, currency, timeZone } = req.body;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Store not found"
      });
    }

    let logoUrl = admin.logoUrl;
    let logoPublicId = admin.logoPublicId;

    // Replace logo if uploaded
    if (req.file) {
      if (admin.logoPublicId) {
        await cloudinary.uploader.destroy(admin.logoPublicId);
      }

      const uploaded = await cloudinary.uploader.upload(req.file.path, {
        folder: "stores"
      });

      logoUrl = uploaded.secure_url;
      logoPublicId = uploaded.public_id;
    }

    // Update allowed fields only
    admin.storeName = storeName ?? admin.storeName;
    admin.mobile = mobile ?? admin.mobile;
    admin.currency = currency ?? admin.currency;
    admin.timeZone = timeZone ?? admin.timeZone;
    admin.logoUrl = logoUrl;
    admin.logoPublicId = logoPublicId;

    await admin.save();

    return res.status(200).json({
      success: true,
      message: "Store details updated successfully",
      data: admin
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});




module.exports = router;
