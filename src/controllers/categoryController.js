const { Category, Product } = require('../models');
const { success, error } = require('../utils/response');

/**
 * Controller de Categorias
 * Gerencia operações relacionadas às categorias de produtos
 */

/**
 * Lista todas as categorias ativas
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
const getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { ativo: true },
      attributes: ['id', 'nome', 'descricao', 'icone'],
      order: [['nome', 'ASC']]
    });

    return success(res, categories, 'Categorias recuperadas com sucesso');

  } catch (err) {
    console.error('Erro ao listar categorias:', err);
    return error(res, 'Erro interno do servidor');
  }
};

/**
 * Lista categorias com contagem de produtos
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
const getCategoriesWithCount = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { ativo: true },
      attributes: [
        'id',
        'nome',
        'descricao',
        'icone',
        [
          Category.sequelize.fn('COUNT', Category.sequelize.col('produtos.id')),
          'totalProdutos'
        ]
      ],
      include: [
        {
          model: Product,
          as: 'produtos',
          attributes: [],
          where: { ativo: true },
          required: false
        }
      ],
      group: ['Category.id'],
      order: [['nome', 'ASC']]
    });

    return success(res, categories, 'Categorias com contagem recuperadas com sucesso');

  } catch (err) {
    console.error('Erro ao listar categorias com contagem:', err);
    return error(res, 'Erro interno do servidor');
  }
};

module.exports = {
  getCategories,
  getCategoriesWithCount
};

