const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * Modelo de Usuário
 * Representa tanto consumidores quanto produtores da plataforma
 */
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  senha: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [6, 255]
    }
  },
  tipo: {
    type: DataTypes.ENUM('consumidor', 'produtor'),
    allowNull: false,
    defaultValue: 'consumidor'
  },
  telefone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: /^[\d\s\-\(\)\+]+$/
    }
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    /**
     * Hook para criptografar a senha antes de salvar
     */
    beforeCreate: async (user) => {
      if (user.senha) {
        const salt = await bcrypt.genSalt(10);
        user.senha = await bcrypt.hash(user.senha, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('senha')) {
        const salt = await bcrypt.genSalt(10);
        user.senha = await bcrypt.hash(user.senha, salt);
      }
    }
  }
});

/**
 * Método para verificar senha
 * @param {string} senhaInformada - Senha informada pelo usuário
 * @returns {boolean} - True se a senha estiver correta
 */
User.prototype.verificarSenha = async function(senhaInformada) {
  return await bcrypt.compare(senhaInformada, this.senha);
};

/**
 * Método para obter dados do usuário sem a senha
 * @returns {object} - Dados do usuário sem a senha
 */
User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.senha;
  return values;
};

module.exports = User;

