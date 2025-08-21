const { Sequelize } = require('sequelize');

/**
 * Setup global para testes
 * Configura o ambiente de teste com SQLite em memória
 */

// Configurar variáveis de ambiente para teste
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret';

// Criar instância do Sequelize para testes com SQLite em memória
const sequelize = new Sequelize('sqlite::memory:', {
  logging: false, // Desabilitar logs durante os testes
  dialect: 'sqlite'
});

// Importar e configurar modelos
const User = require('../models/User');
const Address = require('../models/Address');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');

// Inicializar modelos com a instância de teste
User.init(User.rawAttributes, { sequelize, modelName: 'User', tableName: 'users' });
Address.init(Address.rawAttributes, { sequelize, modelName: 'Address', tableName: 'addresses' });
Category.init(Category.rawAttributes, { sequelize, modelName: 'Category', tableName: 'categories' });
Product.init(Product.rawAttributes, { sequelize, modelName: 'Product', tableName: 'products' });
Cart.init(Cart.rawAttributes, { sequelize, modelName: 'Cart', tableName: 'carts' });
CartItem.init(CartItem.rawAttributes, { sequelize, modelName: 'CartItem', tableName: 'cart_items' });
Order.init(Order.rawAttributes, { sequelize, modelName: 'Order', tableName: 'orders' });
OrderItem.init(OrderItem.rawAttributes, { sequelize, modelName: 'OrderItem', tableName: 'order_items' });

// Configurar relacionamentos
User.hasMany(Address, { foreignKey: 'userId', as: 'enderecos' });
Address.belongsTo(User, { foreignKey: 'userId', as: 'usuario' });

User.hasMany(Product, { foreignKey: 'produtorId', as: 'produtos' });
Product.belongsTo(User, { foreignKey: 'produtorId', as: 'produtor' });

User.hasOne(Cart, { foreignKey: 'userId', as: 'carrinho' });
Cart.belongsTo(User, { foreignKey: 'userId', as: 'usuario' });

User.hasMany(Order, { foreignKey: 'consumidorId', as: 'pedidos' });
Order.belongsTo(User, { foreignKey: 'consumidorId', as: 'consumidor' });

Category.hasMany(Product, { foreignKey: 'categoryId', as: 'produtos' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'categoria' });

Cart.hasMany(CartItem, { foreignKey: 'cartId', as: 'itens' });
CartItem.belongsTo(Cart, { foreignKey: 'cartId', as: 'carrinho' });

CartItem.belongsTo(Product, { foreignKey: 'productId', as: 'produto' });
Product.hasMany(CartItem, { foreignKey: 'productId', as: 'itensCarrinho' });

Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'itens' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'pedido' });

OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'produto' });
Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'itensPedido' });

// Disponibilizar para os testes
global.testSequelize = sequelize;
global.testModels = {
  User,
  Address,
  Category,
  Product,
  Cart,
  CartItem,
  Order,
  OrderItem
};

// Hook executado antes de todos os testes
beforeAll(async () => {
  try {
    // Sincronizar modelos (criar tabelas)
    await sequelize.sync({ force: true });
    
    console.log('✅ Banco de dados de teste configurado (SQLite em memória)');
  } catch (error) {
    console.error('❌ Erro ao configurar banco de teste:', error);
    throw error;
  }
});

// Hook executado após todos os testes
afterAll(async () => {
  try {
    // Fechar conexão com o banco
    await sequelize.close();
    console.log('✅ Conexão com banco de teste fechada');
  } catch (error) {
    console.error('❌ Erro ao fechar conexão:', error);
  }
});

// Hook executado antes de cada teste
beforeEach(async () => {
  // Limpar todas as tabelas antes de cada teste
  const models = Object.values(sequelize.models);
  
  for (const model of models) {
    await model.destroy({ where: {}, force: true });
  }
});

// Configurações globais para testes
global.console = {
  ...console,
  // Manter apenas error e warn para debug
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
};

