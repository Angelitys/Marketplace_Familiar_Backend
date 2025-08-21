const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Modelo de Pedido
 * Representa os pedidos realizados pelos consumidores
 */
const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  consumidorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pendente', 'confirmado', 'preparando', 'enviado', 'entregue', 'cancelado'),
    allowNull: false,
    defaultValue: 'pendente'
  },
  valorTotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  enderecoEntrega: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Cópia do endereço no momento do pedido'
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  dataEntregaPrevista: {
    type: DataTypes.DATE,
    allowNull: true
  },
  dataEntregaRealizada: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'orders',
  timestamps: true
});

/**
 * Método para verificar se o pedido pode ser cancelado
 * @returns {boolean} - True se o pedido pode ser cancelado
 */
Order.prototype.podeCancelar = function() {
  return ['pendente', 'confirmado'].includes(this.status);
};

/**
 * Método para verificar se o pedido está finalizado
 * @returns {boolean} - True se o pedido está finalizado
 */
Order.prototype.estaFinalizado = function() {
  return ['entregue', 'cancelado'].includes(this.status);
};

module.exports = Order;

