/**
 * Utilitários para respostas padronizadas da API
 */

/**
 * Resposta de sucesso
 * @param {Object} res - Objeto de resposta do Express
 * @param {*} data - Dados a serem retornados
 * @param {string} message - Mensagem de sucesso
 * @param {number} statusCode - Código de status HTTP
 */
const success = (res, data = null, message = 'Operação realizada com sucesso', statusCode = 200) => {
  const response = {
    success: true,
    message,
    data
  };

  return res.status(statusCode).json(response);
};

/**
 * Resposta de erro
 * @param {Object} res - Objeto de resposta do Express
 * @param {string} message - Mensagem de erro
 * @param {number} statusCode - Código de status HTTP
 * @param {Array} errors - Array de erros específicos
 */
const error = (res, message = 'Erro interno do servidor', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
    ...(errors && { errors })
  };

  return res.status(statusCode).json(response);
};

/**
 * Resposta de erro de validação
 * @param {Object} res - Objeto de resposta do Express
 * @param {Array} errors - Array de erros de validação
 * @param {string} message - Mensagem principal
 */
const validationError = (res, errors, message = 'Dados inválidos') => {
  return error(res, message, 400, errors);
};

/**
 * Resposta de não autorizado
 * @param {Object} res - Objeto de resposta do Express
 * @param {string} message - Mensagem de erro
 */
const unauthorized = (res, message = 'Não autorizado') => {
  return error(res, message, 401);
};

/**
 * Resposta de proibido
 * @param {Object} res - Objeto de resposta do Express
 * @param {string} message - Mensagem de erro
 */
const forbidden = (res, message = 'Acesso negado') => {
  return error(res, message, 403);
};

/**
 * Resposta de não encontrado
 * @param {Object} res - Objeto de resposta do Express
 * @param {string} message - Mensagem de erro
 */
const notFound = (res, message = 'Recurso não encontrado') => {
  return error(res, message, 404);
};

/**
 * Resposta de conflito
 * @param {Object} res - Objeto de resposta do Express
 * @param {string} message - Mensagem de erro
 */
const conflict = (res, message = 'Conflito de dados') => {
  return error(res, message, 409);
};

/**
 * Resposta paginada
 * @param {Object} res - Objeto de resposta do Express
 * @param {Array} data - Dados da página atual
 * @param {Object} pagination - Informações de paginação
 * @param {string} message - Mensagem de sucesso
 */
const paginated = (res, data, pagination, message = 'Dados recuperados com sucesso') => {
  const response = {
    success: true,
    message,
    data,
    pagination: {
      currentPage: pagination.page,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      totalItems: pagination.total,
      itemsPerPage: pagination.limit,
      hasNextPage: pagination.page < Math.ceil(pagination.total / pagination.limit),
      hasPrevPage: pagination.page > 1
    }
  };

  return res.status(200).json(response);
};

module.exports = {
  success,
  error,
  validationError,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  paginated
};

