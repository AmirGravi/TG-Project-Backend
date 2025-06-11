
// اسکیمای دسته بندی محصول

const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    createdAt: { type: Date, default: Date.now },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null }, // ارجاع به دسته‌بندی والد
    image: {type: String, default: null},
});
module.exports =  mongoose.model('Category' , CategorySchema)
