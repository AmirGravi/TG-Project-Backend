const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload'); // ساختش رو پایین توضیح می‌دم
const productController = require('../controllers/productController');

// آدرس‌ها:

// افزودن محصول
router.post(
    '/',
    upload.fields([
        { name: 'images[]', maxCount: 10 },
        { name: 'colors[]', maxCount: 10 },
        { name: 'sizes[]', maxCount: 10 }
    ]),
    productController.createProduct
);

// دریافت همه محصولات
router.get('/', productController.getAllProducts);

// جستجو
router.get('/search', productController.searchProducts);

// دریافت محصول خاص
router.get('/:id', productController.getProductById);

// حذف محصول
router.delete('/:id', productController.deleteProduct);

// ویرایش محصول
router.put(
    '/:id',
    upload.fields([
        { name: 'images[]', maxCount: 10 },
        { name: 'colors[]', maxCount: 10 },
        { name: 'sizes[]', maxCount: 10 }
    ]),
    productController.updateProduct
);

// حذف تصویر محصول
router.delete('/images/:imageId', productController.deleteImage);

module.exports = router;
