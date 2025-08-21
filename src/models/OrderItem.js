const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Modelo de Item do Pedido
 * Representa os itens dentro de um pedido
 */
const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  quantidade: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  precoUnitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01
    },
    comment: 'Preço do produto no momento do pedido'
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  }
}, {
  tableName: 'order_items',
  timestamps: true,
  hooks: {
    /**
     * Hook para calcular o subtotal antes de salvar
     */
    beforeCreate: (orderItem) => {
      orderItem.subtotal = orderItem.quantidade * orderItem.precoUnitario;
    },
    beforeUpdate: (orderItem) => {
      if (orderItem.changed('quantidade') || orderItem.changed('precoUnitario')) {
        orderItem.subtotal = orderItem.quantidade * orderItem.precoUnitario;
      }
    }
  }
});

module.exports = OrderItem;

