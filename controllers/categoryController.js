const Category = require('../models/Category');

// 🟢 ساخت دسته‌بندی جدید
exports.createCategory = async (req, res) => {
    try {
        const { name, description, parent } = req.body;
        const parentCategory = parent ? await Category.findById(parent) : null;

        if (parent && !parentCategory) {
            return res.status(400).json({ message: 'دسته‌بندی والد پیدا نشد.' });
        }

        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        const newCategory = new Category({
            name,
            description,
            parent: parent || null,
            image: imageUrl,
        });

        await newCategory.save();
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(500).json({ message: 'خطا در ایجاد دسته‌بندی', error });
    }
};

// 🟡 دریافت همه دسته‌بندی‌ها با ساختار درختی
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find().lean();

        const buildTree = (categories, parent = null) => {
            return categories
                .filter(cat => String(cat.parent) === String(parent))
                .map(cat => ({
                    ...cat,
                    children: buildTree(categories, cat._id)
                }));
        };

        const categoryTree = buildTree(categories);
        res.json(categoryTree);
    } catch (error) {
        res.status(500).json({ message: 'خطا در دریافت دسته‌بندی‌ها', error });
    }
};

// 🔵 ویرایش دسته‌بندی
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, parent } = req.body;

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: 'دسته‌بندی یافت نشد.' });
        }

        if (parent === 'none') {
            category.parent = null;
        }

        if (parent && parent !== '' && parent !== 'none' && parent !== id) {
            const parentCategory = await Category.findById(parent);
            if (!parentCategory) {
                return res.status(400).json({ message: 'دسته‌بندی والد پیدا نشد.' });
            }

            const isParentHasChildren = await Category.exists({ parent: id });
            if (isParentHasChildren) {
                return res.status(400).json({
                    message: 'این دسته‌بندی نمی‌تواند به‌عنوان والد انتخاب شود، زیرا خودش دارای زیرمجموعه است.'
                });
            }
        }

        if (parent === id) {
            return res.status(400).json({ message: 'یک دسته‌بندی نمی‌تواند والد خودش باشد.' });
        }

        category.name = name || category.name;
        category.description = description || category.description;
        category.parent = parent && parent !== '' && parent !== 'none' ? parent : null;

        if (req.file) {
            const imagePath = `/uploads/${req.file.filename}`;
            category.image = imagePath;
        }

        const updatedCategory = await category.save();
        res.json({ message: 'دسته‌بندی به‌روزرسانی شد.', category: updatedCategory });
    } catch (error) {
        res.status(500).json({ message: 'خطا در ویرایش دسته‌بندی', error });
    }
};

// 🔴 حذف دسته‌بندی
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: 'دسته‌بندی یافت نشد.' });
        }

        const childCategories = await Category.find({ parent: id });
        if (childCategories.length > 0) {
            return res.status(400).json({
                message: 'این دسته‌بندی دارای زیرشاخه است و نمی‌توان آن را حذف کرد.'
            });
        }

        await category.deleteOne();

        res.json({ message: 'دسته‌بندی با موفقیت حذف شد.' });
    } catch (error) {
        res.status(500).json({ message: 'خطا در حذف دسته‌بندی', error });
    }
};
