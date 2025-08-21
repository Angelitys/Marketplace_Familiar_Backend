const { sequelize } = require('../config/database');

// Importar todos os modelos
const User = require('./User');
const Address = require('./Address');
const Category = require('./Category');
const Product = require('./Product');
const Cart = require('./Cart');
const CartItem = require('./CartItem');
const Order = require('./Order');
const OrderItem = require('./OrderItem');

/**
 * Definição dos relacionamentos entre os modelos
 */

// Relacionamentos do User
User.hasMany(Address, { foreignKey: 'userId', as: 'enderecos' });
Address.belongsTo(User, { foreignKey: 'userId', as: 'usuario' });

User.hasMany(Product, { foreignKey: 'produtorId', as: 'produtos' });
Product.belongsTo(User, { foreignKey: 'produtorId', as: 'produtor' });

User.hasOne(Cart, { foreignKey: 'userId', as: 'carrinho' });
Cart.belongsTo(User, { foreignKey: 'userId', as: 'usuario' });

User.hasMany(Order, { foreignKey: 'consumidorId', as: 'pedidos' });
Order.belongsTo(User, { foreignKey: 'consumidorId', as: 'consumidor' });

// Relacionamentos da Category
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'produtos' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'categoria' });

// Relacionamentos do Cart
Cart.hasMany(CartItem, { foreignKey: 'cartId', as: 'itens' });
CartItem.belongsTo(Cart, { foreignKey: 'cartId', as: 'carrinho' });

CartItem.belongsTo(Product, { foreignKey: 'productId', as: 'produto' });
Product.hasMany(CartItem, { foreignKey: 'productId', as: 'itensCarrinho' });

// Relacionamentos do Order
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'itens' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'pedido' });

OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'produto' });
Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'itensPedido' });

/**
 * Função para testar a conexão com o banco de dados
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso.');
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco de dados:', error);
    throw error;
  }
};

/**
 * Função para sincronizar todos os modelos com o banco de dados
 * @param {boolean} force - Se true, recria as tabelas (apaga dados existentes)
 */
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log('✅ Banco de dados sincronizado com sucesso.');
    
    if (force) {
      console.log('⚠️  Todas as tabelas foram recriadas (dados anteriores foram perdidos).');
    }
  } catch (error) {
    console.error('❌ Erro ao sincronizar banco de dados:', error);
    throw error;
  }
};

/**
 * Função para popular o banco com dados iniciais
 */
const seedDatabase = async () => {
  try {
    // Verificar se já existem categorias
    const categoriesCount = await Category.count();
    
    if (categoriesCount === 0) {
      // Criar categorias padrão
      await Category.bulkCreate([
        {
          nome: 'Vegetais',
          descricao: 'Verduras e legumes frescos',
          icone: 'leaf'
        },
        {
          nome: 'Frutas',
          descricao: 'Frutas frescas da estação',
          icone: 'apple'
        },
        {
          nome: 'Laticínios',
          descricao: 'Leite, queijos e derivados',
          icone: 'milk'
        },
        {
          nome: 'Grãos',
          descricao: 'Feijão, arroz, milho e outros grãos',
          icone: 'grain'
        },
        {
          nome: 'Temperos',
          descricao: 'Ervas e temperos naturais',
          icone: 'herb'
        }
      ]);
      
      console.log('✅ Categorias padrão criadas com sucesso.');
    }
  } catch (error) {
    console.error('❌ Erro ao popular banco de dados:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  User,
  Address,
  Category,
  Product,
  Cart,
  CartItem,
  Order,
  OrderItem,
  testConnection,
  syncDatabase,
  seedDatabase
};

