const multer = require("multer");
const storage = multer.diskStorage({});
const upload = multer({ storage });

const express = require("express");
const router = express.Router();
const cloudinary = require("../config/cloudinary");
const Banner = require("../models/BannerImage");

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    // 1️⃣ Delete image from Cloudinary
    await cloudinary.uploader.destroy(banner.publicId);

    // 2️⃣ Delete banner record from MongoDB
    await Banner.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Banner image deleted successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ADD
router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    // 1️⃣ Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "banners",
    });

    // 2️⃣ Save to MongoDB
    const banner = await Banner.create({
      imageUrl: result.secure_url,
      publicId: result.public_id,
    });

    res.status(201).json({
      success: true,
      message: "Banner image uploaded successfully",
      data: banner,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET
router.get("/", async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: banners,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});



module.exports = router;
