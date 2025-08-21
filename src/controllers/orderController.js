const { Order, OrderItem, Cart, CartItem, Product, Category, User, Address } = require('../models');
const { success, error, notFound, validationError, forbidden, paginated } = require('../utils/response');
const { sequelize } = require('../config/database');

/**
 * Controller de Pedidos
 * Gerencia criação e acompanhamento de pedidos
 */

/**
 * Cria um novo pedido a partir do carrinho
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
const createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { enderecoId, observacoes } = req.body;
    const userId = req.user.id;

    // Buscar carrinho com itens
    const cart = await Cart.findOne({
      where: { userId },
      include: [
        {
          model: CartItem,
          as: 'itens',
          include: [
            {
              model: Product,
              as: 'produto'
            }
          ]
        }
      ]
    });

    if (!cart || cart.itens.length === 0) {
      await transaction.rollback();
      return validationError(res, ['Carrinho está vazio']);
    }

    // Buscar endereço de entrega
    let enderecoEntrega;
    if (enderecoId) {
      const address = await Address.findOne({
        where: { id: enderecoId, userId }
      });
      
      if (!address) {
        await transaction.rollback();
        return notFound(res, 'Endereço não encontrado');
      }
      
      enderecoEntrega = address.toJSON();
    } else {
      // Usar endereço principal
      const address = await Address.findOne({
        where: { userId, principal: true }
      });
      
      if (!address) {
        await transaction.rollback();
        return validationError(res, ['Nenhum endereço de entrega encontrado']);
      }
      
      enderecoEntrega = address.toJSON();
    }

    // Verificar estoque e calcular valor total
    let valorTotal = 0;
    const itensValidos = [];

    for (const item of cart.itens) {
      const product = item.produto;
      
      if (!product.ativo) {
        await transaction.rollback();
        return validationError(res, [`Produto "${product.nome}" não está mais disponível`]);
      }
      
      if (product.estoque < item.quantidade) {
        await transaction.rollback();
        return validationError(res, [`Estoque insuficiente para "${product.nome}". Disponível: ${product.estoque}`]);
      }
      
      const precoUnitario = product.getPrecoFinal();
      const subtotal = precoUnitario * item.quantidade;
      valorTotal += subtotal;
      
      itensValidos.push({
        productId: product.id,
        quantidade: item.quantidade,
        precoUnitario,
        subtotal
      });
    }

    // Criar pedido
    const order = await Order.create({
      consumidorId: userId,
      valorTotal: parseFloat(valorTotal.toFixed(2)),
      enderecoEntrega,
      observacoes,
      status: 'pendente'
    }, { transaction });

    // Criar itens do pedido e atualizar estoque
    for (const itemData of itensValidos) {
      await OrderItem.create({
        orderId: order.id,
        productId: itemData.productId,
        quantidade: itemData.quantidade,
        precoUnitario: itemData.precoUnitario,
        subtotal: itemData.subtotal
      }, { transaction });

      // Atualizar estoque
      await Product.decrement('estoque', {
        by: itemData.quantidade,
        where: { id: itemData.productId },
        transaction
      });
    }

    // Limpar carrinho
    await CartItem.destroy({
      where: { cartId: cart.id },
      transaction
    });

    await transaction.commit();

    // Buscar pedido criado com relacionamentos
    const createdOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: 'itens',
          include: [
            {
              model: Product,
              as: 'produto',
              include: [
                {
                  model: Category,
                  as: 'categoria',
                  attributes: ['id', 'nome']
                }
              ]
            }
          ]
        }
      ]
    });

    return success(res, createdOrder, 'Pedido criado com sucesso', 201);

  } catch (err) {
    await transaction.rollback();
    console.error('Erro ao criar pedido:', err);
    return error(res, 'Erro interno do servidor');
  }
};

/**
 * Lista pedidos do usuário logado
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
const getMyOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status
    } = req.query;

    const offset = (page - 1) * limit;
    const where = { consumidorId: req.user.id };

    if (status) {
      where.status = status;
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: OrderItem,
          as: 'itens',
          include: [
            {
              model: Product,
              as: 'produto',
              attributes: ['id', 'nome', 'imagemUrl']
            }
          ]
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
    console.error('Erro ao listar pedidos:', err);
    return error(res, 'Erro interno do servidor');
  }
};

/**
 * Obtém detalhes de um pedido específico
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({
      where: { id, consumidorId: userId },
      include: [
        {
          model: OrderItem,
          as: 'itens',
          include: [
            {
              model: Product,
              as: 'produto',
              include: [
                {
                  model: Category,
                  as: 'categoria',
                  attributes: ['id', 'nome']
                },
                {
                  model: User,
                  as: 'produtor',
                  attributes: ['id', 'nome', 'telefone']
                }
              ]
            }
          ]
        }
      ]
    });

    if (!order) {
      return notFound(res, 'Pedido não encontrado');
    }

    return success(res, order, 'Pedido encontrado');

  } catch (err) {
    console.error('Erro ao buscar pedido:', err);
    return error(res, 'Erro interno do servidor');
  }
};

/**
 * Cancela um pedido (apenas se estiver pendente ou confirmado)
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
const cancelOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({
      where: { id, consumidorId: userId },
      include: [
        {
          model: OrderItem,
          as: 'itens'
        }
      ]
    });

    if (!order) {
      await transaction.rollback();
      return notFound(res, 'Pedido não encontrado');
    }

    if (!order.podeCancelar()) {
      await transaction.rollback();
      return validationError(res, ['Pedido não pode ser cancelado neste status']);
    }

    // Restaurar estoque
    for (const item of order.itens) {
      await Product.increment('estoque', {
        by: item.quantidade,
        where: { id: item.productId },
        transaction
      });
    }

    // Atualizar status do pedido
    await order.update({ status: 'cancelado' }, { transaction });

    await transaction.commit();

    return success(res, order, 'Pedido cancelado com sucesso');

  } catch (err) {
    await transaction.rollback();
    console.error('Erro ao cancelar pedido:', err);
    return error(res, 'Erro interno do servidor');
  }
};

/**
 * Lista vendas do produtor logado
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
const getMySales = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status
    } = req.query;

    const offset = (page - 1) * limit;
    const produtorId = req.user.id;

    // Buscar pedidos que contêm produtos do produtor
    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: OrderItem,
          as: 'itens',
          required: true,
          include: [
            {
              model: Product,
              as: 'produto',
              where: { produtorId },
              attributes: ['id', 'nome', 'imagemUrl']
            }
          ]
        },
        {
          model: User,
          as: 'consumidor',
          attributes: ['id', 'nome']
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
    console.error('Erro ao listar vendas:', err);
    return error(res, 'Erro interno do servidor');
  }
};

/**
 * Atualiza status de um pedido (apenas produtores)
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const produtorId = req.user.id;

    const validStatuses = ['confirmado', 'preparando', 'enviado', 'entregue'];
    if (!validStatuses.includes(status)) {
      return validationError(res, ['Status inválido']);
    }

    // Verificar se o pedido contém produtos do produtor
    const order = await Order.findOne({
      where: { id },
      include: [
        {
          model: OrderItem,
          as: 'itens',
          required: true,
          include: [
            {
              model: Product,
              as: 'produto',
              where: { produtorId }
            }
          ]
        }
      ]
    });

    if (!order) {
      return notFound(res, 'Pedido não encontrado ou você não tem permissão para alterá-lo');
    }

    if (order.estaFinalizado()) {
      return validationError(res, ['Pedido já foi finalizado']);
    }

    // Atualizar status
    const updateData = { status };
    if (status === 'entregue') {
      updateData.dataEntregaRealizada = new Date();
    }

    await order.update(updateData);

    return success(res, order, 'Status do pedido atualizado');

  } catch (err) {
    console.error('Erro ao atualizar status do pedido:', err);
    return error(res, 'Erro interno do servidor');
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getMySales,
  updateOrderStatus
};

