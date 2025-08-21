const jwt = require('jsonwebtoken');

/**
 * Utilitários para manipulação de JWT
 */

/**
 * Gera um token JWT para o usuário
 * @param {Object} user - Objeto do usuário
 * @returns {string} - Token JWT
 */
const generateToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    tipo: user.tipo
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d' // Token expira em 7 dias
  });
};

/**
 * Gera um token de refresh
 * @param {Object} user - Objeto do usuário
 * @returns {string} - Token de refresh
 */
const generateRefreshToken = (user) => {
  const payload = {
    userId: user.id,
    type: 'refresh'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '30d' // Refresh token expira em 30 dias
  });
};

/**
 * Verifica se um token é válido
 * @param {string} token - Token a ser verificado
 * @returns {Object|null} - Payload decodificado ou null se inválido
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Decodifica um token sem verificar a assinatura
 * @param {string} token - Token a ser decodificado
 * @returns {Object|null} - Payload decodificado ou null se inválido
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

/**
 * Verifica se um token está expirado
 * @param {string} token - Token a ser verificado
 * @returns {boolean} - True se o token estiver expirado
 */
const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
  isTokenExpired
};

