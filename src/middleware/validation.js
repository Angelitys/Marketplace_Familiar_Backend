/**
 * Middleware de validação de dados
 * Contém funções para validar diferentes tipos de entrada
 */

/**
 * Valida dados de registro de usuário
 */
const validateUserRegistration = (req, res, next) => {
  const { nome, email, senha, tipo } = req.body;
  const errors = [];

  // Validar nome
  if (!nome || nome.trim().length < 2) {
    errors.push('Nome deve ter pelo menos 2 caracteres');
  }

  // Validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('Email deve ter um formato válido');
  }

  // Validar senha
  if (!senha || senha.length < 6) {
    errors.push('Senha deve ter pelo menos 6 caracteres');
  }

  // Validar tipo
  if (!tipo || !['consumidor', 'produtor'].includes(tipo)) {
    errors.push('Tipo deve ser "consumidor" ou "produtor"');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors
    });
  }

  next();
};

/**
 * Valida dados de login
 */
const validateLogin = (req, res, next) => {
  const { email, senha } = req.body;
  const errors = [];

  if (!email) {
    errors.push('Email é obrigatório');
  }

  if (!senha) {
    errors.push('Senha é obrigatória');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors
    });
  }

  next();
};

/**
 * Valida dados de produto
 */
const validateProduct = (req, res, next) => {
  const { nome, preco, categoryId, unidadeMedida, estoque } = req.body;
  const errors = [];

  // Validar nome
  if (!nome || nome.trim().length < 2) {
    errors.push('Nome do produto deve ter pelo menos 2 caracteres');
  }

  // Validar preço
  if (!preco || isNaN(preco) || parseFloat(preco) <= 0) {
    errors.push('Preço deve ser um número maior que zero');
  }

  // Validar categoria
  if (!categoryId || isNaN(categoryId)) {
    errors.push('Categoria é obrigatória');
  }

  // Validar unidade de medida
  const unidadesValidas = ['kg', 'g', 'unidade', 'litro', 'ml', 'pacote', 'caixa'];
  if (!unidadeMedida || !unidadesValidas.includes(unidadeMedida)) {
    errors.push('Unidade de medida deve ser uma das opções válidas');
  }

  // Validar estoque
  if (estoque !== undefined && (isNaN(estoque) || parseInt(estoque) < 0)) {
    errors.push('Estoque deve ser um número não negativo');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors
    });
  }

  next();
};

/**
 * Valida dados de endereço
 */
const validateAddress = (req, res, next) => {
  const { rua, numero, bairro, cidade, estado, cep } = req.body;
  const errors = [];

  if (!rua || rua.trim().length < 3) {
    errors.push('Rua deve ter pelo menos 3 caracteres');
  }

  if (!numero || numero.trim().length < 1) {
    errors.push('Número é obrigatório');
  }

  if (!bairro || bairro.trim().length < 2) {
    errors.push('Bairro deve ter pelo menos 2 caracteres');
  }

  if (!cidade || cidade.trim().length < 2) {
    errors.push('Cidade deve ter pelo menos 2 caracteres');
  }

  if (!estado || estado.length !== 2) {
    errors.push('Estado deve ter exatamente 2 caracteres');
  }

  const cepRegex = /^\d{5}-?\d{3}$/;
  if (!cep || !cepRegex.test(cep)) {
    errors.push('CEP deve ter o formato 00000-000');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors
    });
  }

  next();
};

/**
 * Valida dados de item do carrinho
 */
const validateCartItem = (req, res, next) => {
  const { productId, quantidade } = req.body;
  const errors = [];

  if (!productId || isNaN(productId)) {
    errors.push('ID do produto é obrigatório');
  }

  if (!quantidade || isNaN(quantidade) || parseInt(quantidade) < 1) {
    errors.push('Quantidade deve ser um número maior que zero');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors
    });
  }

  next();
};

/**
 * Middleware genérico para capturar erros de validação do Sequelize
 */
const handleSequelizeValidationError = (error, req, res, next) => {
  if (error.name === 'SequelizeValidationError') {
    const errors = error.errors.map(err => err.message);
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors
    });
  }
  
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Dados já existem no sistema',
      errors: ['Email já está em uso']
    });
  }

  next(error);
};

module.exports = {
  validateUserRegistration,
  validateLogin,
  validateProduct,
  validateAddress,
  validateCartItem,
  handleSequelizeValidationError
};

