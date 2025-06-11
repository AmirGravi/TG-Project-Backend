const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const upload = require('../middlewares/upload');

// ایجاد دسته‌بندی
router.post('/', upload.single('image'), categoryController.createCategory);

// گرفتن همه دسته‌ها به صورت درختی
router.get('/', categoryController.getAllCategories);

// ویرایش
router.put('/:id', upload.single('image'), categoryController.updateCategory);

// حذف دسته
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
