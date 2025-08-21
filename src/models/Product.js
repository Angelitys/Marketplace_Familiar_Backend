const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Modelo de Produto
 * Representa os produtos oferecidos pelos produtores
 */
const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 150]
    }
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  preco: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  unidadeMedida: {
    type: DataTypes.ENUM('kg', 'g', 'unidade', 'litro', 'ml', 'pacote', 'caixa'),
    allowNull: false,
    defaultValue: 'kg'
  },
  estoque: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  imagemUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  produtorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  promocao: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  percentualDesconto: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  }
}, {
  tableName: 'products',
  timestamps: true
});

/**
 * Método para calcular preço com desconto
 * @returns {number} - Preço final considerando desconto
 */
Product.prototype.getPrecoFinal = function() {
  if (this.promocao && this.percentualDesconto) {
    const desconto = (this.preco * this.percentualDesconto) / 100;
    return this.preco - desconto;
  }
  return this.preco;
};

module.exports = Product;

