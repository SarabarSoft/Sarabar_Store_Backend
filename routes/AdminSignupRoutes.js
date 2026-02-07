const multer = require("multer");
const storage = multer.diskStorage({});
const upload = multer({ storage });

const express = require('express');
const router = express.Router();
const cloudinary = require("../config/cloudinary");
const Admin = require('../models/AdminSignup');
const jwt = require("jsonwebtoken");
const authMiddleware = require('../middleware/authtoken');
const Store = require('../models/Store');

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
    // const existingAdmin = await Admin.findOne({});
    // if (existingAdmin) {
    //   return res.status(403).json({
    //     success: false,
    //     isNewUser: false,
    //     message:
    //       "This store is already registered with another email. Please contact your development team to use the email that was registered earlier."
    //   });
    // }

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
    const { storeName, email, mobile, currency, timeZone, fcmToken } = req.body;

    let admin = await Admin.findOne({ email });

    // 🔹 Only handle logo if uploaded
    let logoUrl = null;
    let logoPublicId = null;

    if (req.file) {
      // If admin already has a logo, delete it from Cloudinary
      if (admin?.logoPublicId) {
        await cloudinary.uploader.destroy(admin.logoPublicId);
      }

      // Upload the new logo
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "stores"
      });

      logoUrl = result.secure_url;
      logoPublicId = result.public_id;
    }

    if (!admin) {
      // 🆕 Create new store
      admin = await Admin.create({
        storeName,
        email,
        mobile,
        currency,
        timeZone,
        fcmToken,
        logoUrl,
        logoPublicId
      });

      // 2️⃣ Create Store linked to Admin
      const store = await Store.create({
        storeName,
        email,
        mobile,
        currency,
        timeZone,
        logoUrl,
        logoPublicId,
        adminId: admin._id
      });

       // 3️⃣ Save store reference inside admin
      admin.storeId = store._id;
      await admin.save();

      return res.status(201).json({
        success: true,
        isNewUser: true,
        message: "Store and Admin registered successfully",
        data: admin
      });
    }

    // 🔁 Update existing store

     const store = await Store.findOne({ adminId: admin._id });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found"
      });
    }

    admin.storeName = storeName ?? admin.storeName;
    admin.mobile = mobile ?? admin.mobile;
    admin.currency = currency ?? admin.currency;
    admin.timeZone = timeZone ?? admin.timeZone;

    if (logoUrl) {
      // delete old logo
      if (store.logoPublicId) {
        await cloudinary.uploader.destroy(store.logoPublicId);
      }

      store.logoUrl = logoUrl;
      store.logoPublicId = logoPublicId;
    }

    await store.save();
    
    if (fcmToken) admin.fcmToken = fcmToken;

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




router.put("/update-store/:adminId",authMiddleware,upload.single("logo"),async (req, res) => {
    try {
      const { adminId } = req.params;
      const { storeName, mobile, currency, timeZone } = req.body;

      // 1️⃣ Find admin
      const admin = await Admin.findById(adminId);
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: "Admin not found"
        });
      }

      // 2️⃣ Find linked store
      const store = await Store.findOne({ adminId: admin._id });
      if (!store) {
        return res.status(404).json({
          success: false,
          message: "Store not found"
        });
      }

      let logoUrl = store.logoUrl;
      let logoPublicId = store.logoPublicId;

      // 3️⃣ Replace logo if uploaded
      if (req.file) {
        if (store.logoPublicId) {
          await cloudinary.uploader.destroy(store.logoPublicId);
        }

        const uploaded = await cloudinary.uploader.upload(req.file.path, {
          folder: "stores"
        });

        logoUrl = uploaded.secure_url;
        logoPublicId = uploaded.public_id;
      }

      // 4️⃣ Update store fields
      store.storeName = storeName ?? store.storeName;
      store.mobile = mobile ?? store.mobile;
      store.currency = currency ?? store.currency;
      //store.timestamps = timeZone ?? store.timeZone;
      store.logoUrl = logoUrl;
      store.logoPublicId = logoPublicId;

      await store.save();

      return res.status(200).json({
        success: true,
        message: "Store updated successfully",
        data: store
      });

    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }
);





module.exports = router;
