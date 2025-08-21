const { Cart, CartItem, Product, Category, User } = require('../models');
const { success, error, notFound, validationError } = require('../utils/response');

/**
 * Controller do Carrinho
 * Gerencia operações do carrinho de compras
 */

/**
 * Obtém o carrinho do usuário logado
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar ou criar carrinho
    let cart = await Cart.findOne({
      where: { userId },
      include: [
        {
          model: CartItem,
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
                  attributes: ['id', 'nome']
                }
              ]
            }
          ]
        }
      ]
    });

    if (!cart) {
      cart = await Cart.create({ userId });
      cart.itens = [];
    }

    // Calcular totais
    let valorTotal = 0;
    let quantidadeTotal = 0;

    const itensComPrecoFinal = cart.itens.map(item => {
      const itemData = item.toJSON();
      const precoFinal = item.produto.getPrecoFinal();
      const subtotal = precoFinal * item.quantidade;
      
      valorTotal += subtotal;
      quantidadeTotal += item.quantidade;

      return {
        ...itemData,
        produto: {
          ...itemData.produto,
          precoFinal
        },
        subtotal
      };
    });

    const cartData = {
      id: cart.id,
      itens: itensComPrecoFinal,
      resumo: {
        quantidadeTotal,
        valorTotal: parseFloat(valorTotal.toFixed(2))
      }
    };

    return success(res, cartData, 'Carrinho recuperado com sucesso');

  } catch (err) {
    console.error('Erro ao buscar carrinho:', err);
    return error(res, 'Erro interno do servidor');
  }
};

/**
 * Adiciona um item ao carrinho
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
const addToCart = async (req, res) => {
  try {
    const { productId, quantidade } = req.body;
    const userId = req.user.id;

    // Verificar se o produto existe e está ativo
    const product = await Product.findOne({
      where: { id: productId, ativo: true }
    });

    if (!product) {
      return notFound(res, 'Produto não encontrado');
    }

    // Verificar estoque
    if (product.estoque < quantidade) {
      return validationError(res, [`Estoque insuficiente. Disponível: ${product.estoque}`]);
    }

    // Buscar ou criar carrinho
    let cart = await Cart.findOne({ where: { userId } });
    if (!cart) {
      cart = await Cart.create({ userId });
    }

    // Verificar se o item já existe no carrinho
    let cartItem = await CartItem.findOne({
      where: { cartId: cart.id, productId }
    });

    if (cartItem) {
      // Atualizar quantidade
      const novaQuantidade = cartItem.quantidade + quantidade;
      
      if (product.estoque < novaQuantidade) {
        return validationError(res, [`Estoque insuficiente. Disponível: ${product.estoque}, no carrinho: ${cartItem.quantidade}`]);
      }

      await cartItem.update({ quantidade: novaQuantidade });
    } else {
      // Criar novo item
      cartItem = await CartItem.create({
        cartId: cart.id,
        productId,
        quantidade
      });
    }

    // Buscar carrinho atualizado
    const updatedCart = await getCartData(userId);

    return success(res, updatedCart, 'Item adicionado ao carrinho');

  } catch (err) {
    console.error('Erro ao adicionar item ao carrinho:', err);
    return error(res, 'Erro interno do servidor');
  }
};

/**
 * Atualiza a quantidade de um item no carrinho
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantidade } = req.body;
    const userId = req.user.id;

    if (quantidade < 1) {
      return validationError(res, ['Quantidade deve ser maior que zero']);
    }

    // Buscar carrinho
    const cart = await Cart.findOne({ where: { userId } });
    if (!cart) {
      return notFound(res, 'Carrinho não encontrado');
    }

    // Buscar item no carrinho
    const cartItem = await CartItem.findOne({
      where: { cartId: cart.id, productId }
    });

    if (!cartItem) {
      return notFound(res, 'Item não encontrado no carrinho');
    }

    // Verificar produto e estoque
    const product = await Product.findByPk(productId);
    if (!product || !product.ativo) {
      return notFound(res, 'Produto não encontrado');
    }

    if (product.estoque < quantidade) {
      return validationError(res, [`Estoque insuficiente. Disponível: ${product.estoque}`]);
    }

    // Atualizar quantidade
    await cartItem.update({ quantidade });

    // Buscar carrinho atualizado
    const updatedCart = await getCartData(userId);

    return success(res, updatedCart, 'Carrinho atualizado');

  } catch (err) {
    console.error('Erro ao atualizar item do carrinho:', err);
    return error(res, 'Erro interno do servidor');
  }
};

/**
 * Remove um item do carrinho
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    // Buscar carrinho
    const cart = await Cart.findOne({ where: { userId } });
    if (!cart) {
      return notFound(res, 'Carrinho não encontrado');
    }

    // Buscar e remover item
    const cartItem = await CartItem.findOne({
      where: { cartId: cart.id, productId }
    });

    if (!cartItem) {
      return notFound(res, 'Item não encontrado no carrinho');
    }

    await cartItem.destroy();

    // Buscar carrinho atualizado
    const updatedCart = await getCartData(userId);

    return success(res, updatedCart, 'Item removido do carrinho');

  } catch (err) {
    console.error('Erro ao remover item do carrinho:', err);
    return error(res, 'Erro interno do servidor');
  }
};

/**
 * Limpa todo o carrinho
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar carrinho
    const cart = await Cart.findOne({ where: { userId } });
    if (!cart) {
      return notFound(res, 'Carrinho não encontrado');
    }

    // Remover todos os itens
    await CartItem.destroy({
      where: { cartId: cart.id }
    });

    // Retornar carrinho vazio
    const emptyCart = {
      id: cart.id,
      itens: [],
      resumo: {
        quantidadeTotal: 0,
        valorTotal: 0
      }
    };

    return success(res, emptyCart, 'Carrinho limpo');

  } catch (err) {
    console.error('Erro ao limpar carrinho:', err);
    return error(res, 'Erro interno do servidor');
  }
};

/**
 * Função auxiliar para buscar dados completos do carrinho
 * @param {number} userId - ID do usuário
 * @returns {Object} - Dados do carrinho
 */
const getCartData = async (userId) => {
  const cart = await Cart.findOne({
    where: { userId },
    include: [
      {
        model: CartItem,
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
                attributes: ['id', 'nome']
              }
            ]
          }
        ]
      }
    ]
  });

  let valorTotal = 0;
  let quantidadeTotal = 0;

  const itensComPrecoFinal = cart.itens.map(item => {
    const itemData = item.toJSON();
    const precoFinal = item.produto.getPrecoFinal();
    const subtotal = precoFinal * item.quantidade;
    
    valorTotal += subtotal;
    quantidadeTotal += item.quantidade;

    return {
      ...itemData,
      produto: {
        ...itemData.produto,
        precoFinal
      },
      subtotal
    };
  });

  return {
    id: cart.id,
    itens: itensComPrecoFinal,
    resumo: {
      quantidadeTotal,
      valorTotal: parseFloat(valorTotal.toFixed(2))
    }
  };
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};

