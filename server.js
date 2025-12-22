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

// 🔐 TOKEN MIDDLEWARE (AFTER PUBLIC ROUTES)
app.use(authMiddleware);

// 🔒 PROTECTED ROUTES
app.use('/api/category', require('./routes/Category'));
app.use('/api/subcategory', require('./routes/SubCategory'));
app.use('/api/products', require('./routes/product'));
app.use('/api/customer', require('./routes/CustomerRoutes'));
app.use('/api/orders', require('./routes/Order'));
app.use('/api/settings', require('./routes/SettingRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));


const PORT = process.env.PORT || 5050;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
