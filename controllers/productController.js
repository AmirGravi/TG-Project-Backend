const Product = require('../models/Product');
const Category = require('../models/Category');
const path = require('path');
const fs = require('fs');

// افزودن محصول جدید
exports.createProduct = async (req, res) => {
    const { name, price, description, colors, sizes, quantity, category } = req.body;

    try {
        const parsedColors = JSON.parse(colors);
        const parsedSizes = JSON.parse(sizes);
        const imagePaths = req.files['images[]']
            ? req.files['images[]'].map(file => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`)
            : [];

        if (!category) return res.status(400).json({ message: 'دسته‌بندی محصول مشخص نشده است.' });

        const categoryObj = await Category.findById(category);
        if (!categoryObj) return res.status(400).json({ message: 'دسته‌بندی معتبر نیست.' });

        const product = new Product({
            name,
            price,
            description,
            images: imagePaths,
            colors: parsedColors,
            sizes: parsedSizes,
            quantity: parseInt(quantity),
            category: categoryObj._id,
        });

        await product.save();
        res.status(201).json({ message: 'محصول با موفقیت اضافه شد.' });
    } catch (error) {
        res.status(500).json({ message: 'خطا در افزودن محصول', error });
    }
};

// دریافت تمام محصولات
exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'خطا در دریافت محصولات', error });
    }
};

// دریافت یک محصول خاص
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'محصول یافت نشد.' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'خطا در دریافت محصول', error });
    }
};

// جستجوی محصولات
exports.searchProducts = async (req, res) => {
    const searchQuery = req.query.query;
    try {
        const products = await Product.find({
            name: { $regex: searchQuery, $options: 'i' }
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'خطا در جستجوی محصولات', error });
    }
};

// حذف محصول
exports.deleteProduct = async (req, res) => {
    try {
        const deleted = await Product.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'محصول یافت نشد.' });
        res.json({ message: 'محصول با موفقیت حذف شد.' });
    } catch (error) {
        res.status(500).json({ message: 'خطا در حذف محصول', error });
    }
};

// ویرایش محصول
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, description, quantity, category } = req.body;

        const imagePaths = req.files['images[]']
            ? req.files['images[]'].map(file => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`)
            : [];

        const colorsRaw = req.body['colors[]'] || req.body['colors'] || [];
        const parsedColors = Array.isArray(colorsRaw)
            ? colorsRaw.map(c => {
                try {
                    return typeof c === 'string' ? JSON.parse(c) : c;
                } catch {
                    return null;
                }
            }).filter(c => c !== null)
            : [];

        const sizes = req.body['sizes[]'] || req.body['sizes'] || [];

        const existingProduct = await Product.findById(id);
        if (!existingProduct) return res.status(404).json({ message: 'محصول یافت نشد.' });

        if (category) {
            const categoryObj = await Category.findById(category);
            if (!categoryObj) return res.status(400).json({ message: 'دسته‌بندی معتبر نیست.' });
            existingProduct.category = categoryObj._id;
        }

        if (parsedColors.length > 0) existingProduct.colors = parsedColors;
        if (sizes.length > 0) existingProduct.sizes = sizes;
        if (name) existingProduct.name = name;
        if (price) existingProduct.price = price;
        if (description) existingProduct.description = description;
        if (imagePaths.length > 0) existingProduct.images = [...existingProduct.images, ...imagePaths];
        if (quantity !== undefined) existingProduct.quantity = quantity;

        const updated = await existingProduct.save();
        res.json({ message: 'محصول با موفقیت به‌روزرسانی شد.', product: updated });
    } catch (error) {
        res.status(500).json({ message: 'خطا در به‌روزرسانی محصول', error });
    }
};

// حذف تصویر از محصول و فایل سیستم
exports.deleteImage = async (req, res) => {
    const imageId = req.params.imageId;
    const imagePath = path.join(__dirname, '../uploads', imageId);
    const fullImagePath = `http://localhost:5000/uploads/${imageId}`;

    try {
        const product = await Product.findOne({ images: { $regex: imageId } });
        if (!product) return res.status(404).send('تصویر در پایگاه داده یافت نشد.');

        if (fs.existsSync(imagePath)) {
            await fs.promises.unlink(imagePath);
        } else {
            return res.status(404).send('فایل در سیستم یافت نشد.');
        }

        await Product.updateOne({ _id: product._id }, { $pull: { images: fullImagePath } });

        res.status(200).send('تصویر حذف شد.');
    } catch (error) {
        res.status(500).send('خطا در حذف تصویر');
    }
};
