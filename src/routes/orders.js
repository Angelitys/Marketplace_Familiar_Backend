const express = require('express');
const router = express.Router();

const orderController = require('../controllers/orderController');
const { authenticateToken, requireConsumidor, requireProdutor } = require('../middleware/auth');

/**
 * Rotas de Pedidos
 * Endpoints para gerenciamento de pedidos e vendas
 */

/**
 * @route   POST /api/orders
 * @desc    Cria um novo pedido a partir do carrinho
 * @access  Private (Consumidor)
 * @body    { enderecoId?, observacoes? }
 */
router.post('/', authenticateToken, requireConsumidor, orderController.createOrder);

/**
 * @route   GET /api/orders
 * @desc    Lista pedidos do usuário logado
 * @access  Private (Consumidor)
 * @query   page, limit, status
 */
router.get('/', authenticateToken, requireConsumidor, orderController.getMyOrders);

/**
 * @route   GET /api/orders/:id
 * @desc    Obtém detalhes de um pedido específico
 * @access  Private (Consumidor)
 */
router.get('/:id', authenticateToken, requireConsumidor, orderController.getOrderById);

/**
 * @route   PUT /api/orders/:id/cancel
 * @desc    Cancela um pedido
 * @access  Private (Consumidor)
 */
router.put('/:id/cancel', authenticateToken, requireConsumidor, orderController.cancelOrder);

/**
 * @route   GET /api/orders/sales/my
 * @desc    Lista vendas do produtor logado
 * @access  Private (Produtor)
 * @query   page, limit, status
 */
router.get('/sales/my', authenticateToken, requireProdutor, orderController.getMySales);

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Atualiza status de um pedido
 * @access  Private (Produtor)
 * @body    { status }
 */
router.put('/:id/status', authenticateToken, requireProdutor, orderController.updateOrderStatus);

module.exports = router;

