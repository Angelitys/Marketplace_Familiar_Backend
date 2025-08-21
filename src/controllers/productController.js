const { Product, Category, User } = require('../models');
const { success, error, notFound, forbidden, paginated } = require('../utils/response');
const { Op } = require('sequelize');

/**
 * Controller de Produtos
 * Gerencia operações CRUD de produtos
 */

/**
 * Lista todos os produtos com filtros opcionais
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      produtor,
      promocao,
      orderBy = 'createdAt',
      order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = { ativo: true };

    // Filtro por categoria
    if (category) {
      where.categoryId = category;
    }

    // Filtro por produtor
    if (produtor) {
      where.produtorId = produtor;
    }

    // Filtro por promoção
    if (promocao === 'true') {
      where.promocao = true;
    }

    // Filtro de busca por nome
    if (search) {
      where.nome = {
        [Op.iLike]: `%${search}%`
      };
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        {
          model: Category,
          as: 'categoria',
          attributes: ['id', 'nome', 'icone']
        },
        {
          model: User,
          as: 'produtor',
          attributes: ['id', 'nome']
        }
      ],
      order: [[orderBy, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Adicionar preço final calculado
    const productsWithFinalPrice = rows.map(product => {
      const productData = product.toJSON();
      productData.precoFinal = product.getPrecoFinal();
      return productData;
    });

    return paginated(res, productsWithFinalPrice, {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count
    });

  } catch (err) {
    console.error('Erro ao listar produtos:', err);
    return error(res, 'Erro interno do servidor');
  }
};

/**
 * Obtém um produto específico por ID
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({
      where: { id, ativo: true },
      include: [
        {
          model: Category,
          as: 'categoria',
          attributes: ['id', 'nome', 'icone']
        },
        {
          model: User,
          as: 'produtor',
          attributes: ['id', 'nome', 'telefone']
        }
      ]
    });

    if (!product) {
      return notFound(res, 'Produto não encontrado');
    }

    const productData = product.toJSON();
    productData.precoFinal = product.getPrecoFinal();

    return success(res, productData, 'Produto encontrado');

  } catch (err) {
    console.error('Erro ao buscar produto:', err);
    return error(res, 'Erro interno do servidor');
  }
};

/**
 * Cria um novo produto (apenas produtores)
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
const createProduct = async (req, res) => {
  try {
    const {
      nome,
      descricao,
      preco,
      unidadeMedida,
      estoque,
      categoryId,
      imagemUrl,
      promocao,
      percentualDesconto
    } = req.body;

    // Verificar se a categoria existe
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return notFound(res, 'Categoria não encontrada');
    }

    const product = await Product.create({
      nome,
      descricao,
      preco,
      unidadeMedida,
      estoque,
      categoryId,
      produtorId: req.user.id,
      imagemUrl,
      promocao: promocao || false,
      percentualDesconto: promocao ? percentualDesconto : null
    });

    // Buscar produto criado com relacionamentos
    const createdProduct = await Product.findByPk(product.id, {
      include: [
        {
          model: Category,
          as: 'categoria',
          attributes: ['id', 'nome', 'icone']
        },
        {
          model: User,
          as: 'produtor',
          attributes: ['id', 'nome']
        }
      ]
    });

    return success(res, createdProduct, 'Produto criado com sucesso', 201);

  } catch (err) {
    console.error('Erro ao criar produto:', err);
    return error(res, 'Erro interno do servidor');
  }
};

/**
 * Atualiza um produto existente
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      descricao,
      preco,
      unidadeMedida,
      estoque,
      categoryId,
      imagemUrl,
      promocao,
      percentualDesconto
    } = req.body;

    // Buscar produto
    const product = await Product.findByPk(id);
    if (!product) {
      return notFound(res, 'Produto não encontrado');
    }

    // Verificar se o usuário é o dono do produto
    if (product.produtorId !== req.user.id) {
      return forbidden(res, 'Você só pode editar seus próprios produtos');
    }

    // Verificar categoria se fornecida
    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return notFound(res, 'Categoria não encontrada');
      }
    }

    // Atualizar produto
    const updateData = {};
    if (nome !== undefined) updateData.nome = nome;
    if (descricao !== undefined) updateData.descricao = descricao;
    if (preco !== undefined) updateData.preco = preco;
    if (unidadeMedida !== undefined) updateData.unidadeMedida = unidadeMedida;
    if (estoque !== undefined) updateData.estoque = estoque;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (imagemUrl !== undefined) updateData.imagemUrl = imagemUrl;
    if (promocao !== undefined) {
      updateData.promocao = promocao;
      updateData.percentualDesconto = promocao ? percentualDesconto : null;
    }

    await product.update(updateData);

    // Buscar produto atualizado com relacionamentos
    const updatedProduct = await Product.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'categoria',
          attributes: ['id', 'nome', 'icone']
        },
        {
          model: User,
          as: 'produtor',
          attributes: ['id', 'nome']
        }
      ]
    });

    return success(res, updatedProduct, 'Produto atualizado com sucesso');

  } catch (err) {
    console.error('Erro ao atualizar produto:', err);
    return error(res, 'Erro interno do servidor');
  }
};

/**
 * Remove um produto (soft delete)
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar produto
    const product = await Product.findByPk(id);
    if (!product) {
      return notFound(res, 'Produto não encontrado');
    }

    // Verificar se o usuário é o dono do produto
    if (product.produtorId !== req.user.id) {
      return forbidden(res, 'Você só pode excluir seus próprios produtos');
    }

    // Soft delete
    await product.update({ ativo: false });

    return success(res, null, 'Produto removido com sucesso');

  } catch (err) {
    console.error('Erro ao remover produto:', err);
    return error(res, 'Erro interno do servidor');
  }
};

/**
 * Lista produtos do produtor logado
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
const getMyProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      ativo
    } = req.query;

    const offset = (page - 1) * limit;
    const where = { produtorId: req.user.id };

    // Filtro por status ativo
    if (ativo !== undefined) {
      where.ativo = ativo === 'true';
    }

    // Filtro de busca
    if (search) {
      where.nome = {
        [Op.iLike]: `%${search}%`
      };
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        {
          model: Category,
          as: 'categoria',
          attributes: ['id', 'nome', 'icone']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return paginated(res, rows, {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count
    });

  } catch (err) {
    console.error('Erro ao listar meus produtos:', err);
    return error(res, 'Erro interno do servidor');
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts
};

