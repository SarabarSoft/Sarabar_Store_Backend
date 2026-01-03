const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const adminAuthRoutes = require('./routes/AdminSignupRoutes');
require('dotenv').config();

const app = express();
const cors = require('cors');
const authMiddleware = require('./middleware/authtoken');


app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// 🔓 PUBLIC ROUTES (NO TOKEN)
app.use('/api/admin', adminAuthRoutes);
app.use('/api/auth', authRoutes);

app.use('/api/mobile',require('./routes/categoryMobileRoute'));
app.use('/api/mobile/products', require('./routes/productMobileRoutes'));
app.use('/api/mobile/auth', require('./routes/mobileAuthRoutes'));

// 🔒 PROTECTED ROUTES
app.use('/api/category', authMiddleware,require('./routes/Category'));
app.use('/api/subcategory', authMiddleware, require('./routes/SubCategory'));
app.use('/api/products', authMiddleware, require('./routes/product'));
app.use('/api/customer', authMiddleware, require('./routes/CustomerRoutes'));
app.use('/api/orders', authMiddleware, require('./routes/Order'));
app.use('/api/settings', authMiddleware, require('./routes/SettingRoutes'));
app.use('/api/payment', authMiddleware, require('./routes/paymentRoutes'));
app.use("/api/banner", authMiddleware,require("./routes/BannerImageRoutes"));
app.use("/api/admin", authMiddleware,require("./routes/adminChangePasswordRoutes"));




const PORT = process.env.PORT || 5050;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
