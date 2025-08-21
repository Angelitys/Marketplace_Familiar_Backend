const express = require('express');
const router = express.Router();

const productController = require('../controllers/productController');
const { authenticateToken, requireProdutor, optionalAuth } = require('../middleware/auth');
const { validateProduct } = require('../middleware/validation');

/**
 * Rotas de Produtos
 * Endpoints para gerenciamento de produtos
 */

/**
 * @route   GET /api/products
 * @desc    Lista todos os produtos com filtros opcionais
 * @access  Public
 * @query   page, limit, category, search, produtor, promocao, orderBy, order
 */
router.get('/', optionalAuth, productController.getProducts);

/**
 * @route   GET /api/products/my
 * @desc    Lista produtos do produtor logado
 * @access  Private (Produtor)
 * @query   page, limit, search, ativo
 */
router.get('/my', authenticateToken, requireProdutor, productController.getMyProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Obtém um produto específico por ID
 * @access  Public
 */
router.get('/:id', optionalAuth, productController.getProductById);

/**
 * @route   POST /api/products
 * @desc    Cria um novo produto
 * @access  Private (Produtor)
 */
router.post('/', authenticateToken, requireProdutor, validateProduct, productController.createProduct);

/**
 * @route   PUT /api/products/:id
 * @desc    Atualiza um produto existente
 * @access  Private (Produtor - apenas próprios produtos)
 */
router.put('/:id', authenticateToken, requireProdutor, validateProduct, productController.updateProduct);

/**
 * @route   DELETE /api/products/:id
 * @desc    Remove um produto (soft delete)
 * @access  Private (Produtor - apenas próprios produtos)
 */
router.delete('/:id', authenticateToken, requireProdutor, productController.deleteProduct);

module.exports = router;

