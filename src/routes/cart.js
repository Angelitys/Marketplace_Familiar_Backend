const express = require('express');
const router = express.Router();

const cartController = require('../controllers/cartController');
const { authenticateToken, requireConsumidor } = require('../middleware/auth');
const { validateCartItem } = require('../middleware/validation');

/**
 * Rotas do Carrinho
 * Endpoints para gerenciamento do carrinho de compras
 */

/**
 * @route   GET /api/cart
 * @desc    Obtém carrinho do usuário logado
 * @access  Private (Consumidor)
 */
router.get('/', authenticateToken, requireConsumidor, cartController.getCart);

/**
 * @route   POST /api/cart/add
 * @desc    Adiciona item ao carrinho
 * @access  Private (Consumidor)
 * @body    { productId, quantidade }
 */
router.post('/add', authenticateToken, requireConsumidor, validateCartItem, cartController.addToCart);

/**
 * @route   PUT /api/cart/update/:productId
 * @desc    Atualiza quantidade de item no carrinho
 * @access  Private (Consumidor)
 * @body    { quantidade }
 */
router.put('/update/:productId', authenticateToken, requireConsumidor, cartController.updateCartItem);

/**
 * @route   DELETE /api/cart/remove/:productId
 * @desc    Remove item do carrinho
 * @access  Private (Consumidor)
 */
router.delete('/remove/:productId', authenticateToken, requireConsumidor, cartController.removeFromCart);

/**
 * @route   DELETE /api/cart/clear
 * @desc    Limpa todo o carrinho
 * @access  Private (Consumidor)
 */
router.delete('/clear', authenticateToken, requireConsumidor, cartController.clearCart);

module.exports = router;

