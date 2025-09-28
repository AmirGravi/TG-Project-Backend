const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const productController = require('../controllers/productController');

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management endpoints
 */

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the product
 *               price:
 *                 type: number
 *                 description: Price of the product
 *               description:
 *                 type: string
 *                 description: Product description
 *               colors:
 *                 type: string
 *                 description: JSON string of colors
 *               sizes:
 *                 type: string
 *                 description: JSON string of sizes
 *               quantity:
 *                 type: integer
 *                 description: Quantity of the product
 *               category:
 *                 type: string
 *                 description: Category ID
 *               images[]:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Product images (up to 10)
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Invalid category or missing fields
 *       500:
 *         description: Server error
 */
router.post(
    '/',
    upload.fields([
        { name: 'images[]', maxCount: 10 },
        { name: 'colors[]', maxCount: 10 },
        { name: 'sizes[]', maxCount: 10 },
    ]),
    productController.createProduct
);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of all products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   price:
 *                     type: number
 *                   description:
 *                     type: string
 *                   images:
 *                     type: array
 *                     items:
 *                       type: string
 *                   colors:
 *                     type: array
 *                     items:
 *                       type: string
 *                   sizes:
 *                     type: array
 *                     items:
 *                       type: string
 *                   quantity:
 *                     type: integer
 *                   category:
 *                     type: string
 *       500:
 *         description: Server error
 */
router.get('/', productController.getAllProducts);

/**
 * @swagger
 * /products/search:
 *   get:
 *     summary: Search products by name
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search query for product name
 *         required: true
 *     responses:
 *       200:
 *         description: List of matching products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   price:
 *                     type: number
 *       500:
 *         description: Server error
 */
router.get('/search', productController.searchProducts);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get a specific product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 price:
 *                   type: number
 *                 description:
 *                   type: string
 *                 images:
 *                   type: array
 *                   items:
 *                     type: string
 *                 colors:
 *                   type: array
 *                   items:
 *                     type: string
 *                 sizes:
 *                   type: array
 *                   items:
 *                     type: string
 *                 quantity:
 *                   type: integer
 *                 category:
 *                   type: string
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.get('/:id', productController.getProductById);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', productController.deleteProduct);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update a product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the product
 *               price:
 *                 type: number
 *                 description: Price of the product
 *               description:
 *                 type: string
 *                 description: Product description
 *               colors:
 *                 type: string
 *                 description: JSON string of colors
 *               sizes:
 *                 type: string
 *                 description: JSON string of sizes
 *               quantity:
 *                 type: integer
 *                 description: Quantity of the product
 *               category:
 *                 type: string
 *                 description: Category ID
 *               images[]:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Product images (up to 10)
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 *       400:
 *         description: Invalid category
 *       500:
 *         description: Server error
 */
router.put(
    '/:id',
    upload.fields([
        { name: 'images[]', maxCount: 10 },
        { name: 'colors[]', maxCount: 10 },
        { name: 'sizes[]', maxCount: 10 },
    ]),
    productController.updateProduct
);

/**
 * @swagger
 * /products/images/{imageId}:
 *   delete:
 *     summary: Delete a product image by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: imageId
 *         schema:
 *           type: string
 *         required: true
 *         description: Image ID or filename
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *       404:
 *         description: Image not found
 *       500:
 *         description: Server error
 */
router.delete('/images/:imageId', productController.deleteImage);



/**
 * @swagger
 * /products/category/{categoryId}:
 *   get:
 *     summary: Get products by category ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         schema:
 *           type: string
 *         required: true
 *         description: Category ID to filter products
 *     responses:
 *       200:
 *         description: List of products in the category
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   price:
 *                     type: number
 *                   description:
 *                     type: string
 *                   images:
 *                     type: array
 *                     items:
 *                       type: string
 *                   colors:
 *                     type: array
 *                     items:
 *                       type: string
 *                   sizes:
 *                     type: array
 *                     items:
 *                       type: string
 *                   quantity:
 *                     type: integer
 *                   category:
 *                     type: string
 *       404:
 *         description: No products found in this category
 *       500:
 *         description: Server error
 */
router.get('/category/:categoryId', productController.getProductsByCategory);


module.exports = router;