const express = require('express');
const router = express.Router();

const addressController = require('../controllers/addressController');
const { authenticateToken } = require('../middleware/auth');
const { validateAddress } = require('../middleware/validation');

/**
 * Rotas de Endereços
 * Endpoints para gerenciamento de endereços dos usuários
 */

/**
 * @route   GET /api/addresses
 * @desc    Lista endereços do usuário logado
 * @access  Private
 */
router.get('/', authenticateToken, addressController.getMyAddresses);

/**
 * @route   POST /api/addresses
 * @desc    Cria um novo endereço
 * @access  Private
 * @body    { rua, numero, complemento?, bairro, cidade, estado, cep, principal? }
 */
router.post('/', authenticateToken, validateAddress, addressController.createAddress);

/**
 * @route   PUT /api/addresses/:id
 * @desc    Atualiza um endereço existente
 * @access  Private
 * @body    { rua?, numero?, complemento?, bairro?, cidade?, estado?, cep?, principal? }
 */
router.put('/:id', authenticateToken, addressController.updateAddress);

/**
 * @route   DELETE /api/addresses/:id
 * @desc    Remove um endereço
 * @access  Private
 */
router.delete('/:id', authenticateToken, addressController.deleteAddress);

/**
 * @route   PUT /api/addresses/:id/set-main
 * @desc    Define um endereço como principal
 * @access  Private
 */
router.put('/:id/set-main', authenticateToken, addressController.setMainAddress);

module.exports = router;

