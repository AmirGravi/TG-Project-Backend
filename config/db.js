const mongoose = require('mongoose');

const connectDB = async () => {
    await mongoose.connect('mongodb://localhost:27017/mydatabase2');
};

module.exports = connectDB;
