const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
require('dotenv').config();
const app = express();
const cors = require('cors');

app.use((req, res, next) => {
  console.log("Request received:", req.method, req.url);
  next();
});

app.use(cors());

// Middleware
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);

const categoryRoutes = require("./routes/Category");
app.use("/api/category", categoryRoutes);



const subcategoryRoutes = require("./routes/SubCategory");
app.use("/api/subcategory", subcategoryRoutes);

const productRoutes = require("./routes/product");
app.use("/api/products", productRoutes)

const userRoutes = require('./routes/CustomerRoutes');
app.use('/api/customer', userRoutes);

const orderRoutes = require('./routes/Order');
app.use('/api/orders', orderRoutes);

const settingRoutes = require('./routes/SettingRoutes');
app.use('/api/settings', settingRoutes);

// Server Listening
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));