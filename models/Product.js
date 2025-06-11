// مدل محصول

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    description: String,
    images: { type: [String], default: [] },
    colors: [{ color: String, name: String }],
    sizes: [String],
    quantity: { type: Number, required: true, default: 0 } // تعداد محصول
    ,
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" }, // رفرنس به دسته‌بندی
    createdAt: { type: Date, default: Date.now },

});
module.exports = mongoose.model('Product', productSchema);


