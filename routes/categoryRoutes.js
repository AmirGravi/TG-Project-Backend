const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const upload = require('../middlewares/upload');

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management endpoints
 */

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the category
 *               description:
 *                 type: string
 *                 description: Category description
 *               parent:
 *                 type: string
 *                 description: ID of the parent category (optional)
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Category image (optional)
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 parent:
 *                   type: string
 *                   nullable: true
 *                 image:
 *                   type: string
 *                   nullable: true
 *       400:
 *         description: Invalid parent category
 *       500:
 *         description: Server error
 */
router.post('/', upload.single('image'), categoryController.createCategory);

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories in a tree structure
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of categories with tree structure
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   parent:
 *                     type: string
 *                     nullable: true
 *                   image:
 *                     type: string
 *                     nullable: true
 *                   children:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         description:
 *                           type: string
 *                         parent:
 *                           type: string
 *                           nullable: true
 *                         image:
 *                           type: string
 *                           nullable: true
 *       500:
 *         description: Server error
 */
router.get('/', categoryController.getAllCategories);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update a category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the category (optional)
 *               description:
 *                 type: string
 *                 description: Category description (optional)
 *               parent:
 *                 type: string
 *                 description: ID of the parent category or 'none' (optional)
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Category image (optional)
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 category:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     parent:
 *                       type: string
 *                       nullable: true
 *                     image:
 *                       type: string
 *                       nullable: true
 *       400:
 *         description: Invalid parent category or category has children
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.put('/:id', upload.single('image'), categoryController.updateCategory);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete a category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       400:
 *         description: Category has subcategories and cannot be deleted
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;