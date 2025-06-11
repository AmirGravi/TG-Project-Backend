const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// اتصال به دیتابیس
require('./config/db')();
require('./utils/initAdmin')();

app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));

// مسیرها
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api', require('./routes/authRoutes'));

// استارت سرور
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
