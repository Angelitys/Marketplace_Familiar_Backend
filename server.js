// src/models/index.js
const { Sequelize } = require("sequelize");
require("dotenv").config();

/**
 * Conexão com o banco de dados
 * Railway fornece a variável DATABASE_URL no formato:
 * postgres://usuario:senha@host:5432/nome_do_banco
 */
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  protocol: "postgres",
  logging: false, // deixa os logs mais limpos
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // necessário no Railway
    },
  },
});

/**
 * Testar conexão com o banco
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexão com o banco estabelecida com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao conectar com o banco de dados:", error);
    throw error;
  }
};

/**
 * Sincronizar modelos com o banco
 * @param {boolean} force - Se true, recria as tabelas (DANGER em produção)
 */
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log("📦 Modelos sincronizados com o banco");
  } catch (error) {
    console.error("❌ Erro ao sincronizar modelos:", error);
    throw error;
  }
};

/**
 * Popular banco com dados iniciais
 * Ajuste conforme a necessidade do seu projeto
 */
const seedDatabase = async () => {
  try {
    console.log("🌱 Seed inicial do banco executado (se aplicável)");
    // exemplo: await User.create({ name: "Admin", email: "admin@test.com" });
  } catch (error) {
    console.error("❌ Erro ao rodar seed:", error);
    throw error;
  }
};

/**
 * Importar modelos
 * Exemplo:
 * const User = require("./User")(sequelize);
 * const Product = require("./Product")(sequelize);
 *
 * Lembre-se de configurar as associações se houver relacionamentos
 */

// const User = require("./User")(sequelize);
// const Product = require("./Product")(sequelize);
// ... mais modelos aqui

// Exportar conexão e métodos utilitários
module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
  seedDatabase,
  // User,
  // Product,
};
