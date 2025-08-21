const { Sequelize } = require('sequelize');
require('dotenv').config();

/**
 * Configuração da conexão com o banco de dados
 * Utiliza SQLite para desenvolvimento/testes e PostgreSQL para produção
 */
const sequelize = process.env.NODE_ENV === 'production' 
  ? new Sequelize(
      process.env.DB_NAME || 'agro_marketplace',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || 'password',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    )
  : new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: process.env.NODE_ENV === 'development' ? console.log : false
    });

/**
 * Testa a conexão com o banco de dados
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso.');
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco de dados:', error);
  }
};

module.exports = { sequelize, testConnection };

