const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Middleware de autenticação JWT
 * Verifica se o token é válido e adiciona o usuário à requisição
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso requerido'
      });
    }

    // Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar o usuário no banco de dados
    const user = await User.findByPk(decoded.userId);
    
    if (!user || !user.ativo) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado ou inativo'
      });
    }

    // Adicionar o usuário à requisição
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }

    console.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Middleware para verificar se o usuário é um produtor
 */
const requireProdutor = (req, res, next) => {
  if (req.user.tipo !== 'produtor') {
    return res.status(403).json({
      success: false,
      message: 'Acesso restrito a produtores'
    });
  }
  next();
};

/**
 * Middleware para verificar se o usuário é um consumidor
 */
const requireConsumidor = (req, res, next) => {
  if (req.user.tipo !== 'consumidor') {
    return res.status(403).json({
      success: false,
      message: 'Acesso restrito a consumidores'
    });
  }
  next();
};

/**
 * Middleware opcional de autenticação
 * Adiciona o usuário à requisição se o token for válido, mas não bloqueia se não houver token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId);
      
      if (user && user.ativo) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Em caso de erro, continua sem autenticação
    next();
  }
};

module.exports = {
  authenticateToken,
  requireProdutor,
  requireConsumidor,
  optionalAuth
};

