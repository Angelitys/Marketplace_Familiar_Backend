const express = require('express');
const router = express.Router();

const categoryController = require('../controllers/categoryController');

/**
 * Rotas de Categorias
 * Endpoints para listagem de categorias
 */

/**
 * @route   GET /api/categories
 * @desc    Lista todas as categorias ativas
 * @access  Public
 */
router.get('/', categoryController.getCategories);

/**
 * @route   GET /api/categories/with-count
 * @desc    Lista categorias com contagem de produtos
 * @access  Public
 */
router.get('/with-count', categoryController.getCategoriesWithCount);

module.exports = router;

