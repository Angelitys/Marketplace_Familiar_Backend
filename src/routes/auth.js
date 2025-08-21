const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validateUserRegistration, validateLogin } = require('../middleware/validation');

/**
 * Rotas de Autenticação
 * Endpoints para registro, login e gerenciamento de perfil
 */

/**
 * @route   POST /api/auth/register
 * @desc    Registra um novo usuário
 * @access  Public
 */
router.post('/register', validateUserRegistration, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Realiza login do usuário
 * @access  Public
 */
router.post('/login', validateLogin, authController.login);

/**
 * @route   GET /api/auth/profile
 * @desc    Obtém perfil do usuário logado
 * @access  Private
 */
router.get('/profile', authenticateToken, authController.getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Atualiza perfil do usuário logado
 * @access  Private
 */
router.put('/profile', authenticateToken, authController.updateProfile);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Altera senha do usuário
 * @access  Private
 */
router.put('/change-password', authenticateToken, authController.changePassword);

/**
 * @route   DELETE /api/auth/deactivate
 * @desc    Desativa conta do usuário
 * @access  Private
 */
router.delete('/deactivate', authenticateToken, authController.deactivateAccount);

module.exports = router;

