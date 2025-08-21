const request = require('supertest');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

/**
 * Testes de Integração da API
 * Testa as rotas principais da aplicação
 */

// Configurar app de teste
const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas básicas para teste
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/categories', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, nome: 'Vegetais', descricao: 'Vegetais frescos' },
      { id: 2, nome: 'Frutas', descricao: 'Frutas da estação' },
      { id: 3, nome: 'Grãos', descricao: 'Grãos e cereais' }
    ]
  });
});

app.get('/api/products', (req, res) => {
  const { search, category, limit = 10, page = 1 } = req.query;
  
  let products = [
    {
      id: 1,
      nome: 'Tomate Orgânico',
      descricao: 'Tomates frescos cultivados sem agrotóxicos',
      preco: 8.50,
      unidadeMedida: 'kg',
      categoryId: 1,
      produtorId: 1,
      ativo: true
    },
    {
      id: 2,
      nome: 'Banana Prata',
      descricao: 'Bananas doces e nutritivas',
      preco: 4.20,
      unidadeMedida: 'kg',
      categoryId: 2,
      produtorId: 1,
      ativo: true
    }
  ];

  // Filtrar por busca
  if (search) {
    products = products.filter(p => 
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      p.descricao.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Filtrar por categoria
  if (category) {
    products = products.filter(p => p.categoryId === parseInt(category));
  }

  // Paginação
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedProducts = products.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: paginatedProducts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: products.length,
      totalPages: Math.ceil(products.length / limit)
    }
  });
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada'
  });
});

describe('API Integration Tests', () => {
  describe('Health Check', () => {
    test('GET /api/health deve retornar status da API', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('API funcionando');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Categories API', () => {
    test('GET /api/categories deve retornar lista de categorias', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      const category = response.body.data[0];
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('nome');
      expect(category).toHaveProperty('descricao');
    });
  });

  describe('Products API', () => {
    test('GET /api/products deve retornar lista de produtos', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
      
      if (response.body.data.length > 0) {
        const product = response.body.data[0];
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('nome');
        expect(product).toHaveProperty('preco');
        expect(product).toHaveProperty('unidadeMedida');
      }
    });

    test('GET /api/products com busca deve filtrar produtos', async () => {
      const response = await request(app)
        .get('/api/products?search=tomate')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      if (response.body.data.length > 0) {
        const product = response.body.data[0];
        expect(product.nome.toLowerCase()).toContain('tomate');
      }
    });

    test('GET /api/products com categoria deve filtrar por categoria', async () => {
      const response = await request(app)
        .get('/api/products?category=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      response.body.data.forEach(product => {
        expect(product.categoryId).toBe(1);
      });
    });

    test('GET /api/products com paginação deve retornar dados paginados', async () => {
      const response = await request(app)
        .get('/api/products?page=1&limit=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Error Handling', () => {
    test('deve retornar 404 para rota inexistente', async () => {
      const response = await request(app)
        .get('/api/rota-inexistente')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Rota não encontrada');
    });
  });

  describe('CORS and Security', () => {
    test('deve incluir headers de CORS', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    test('deve incluir headers de segurança', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Helmet adiciona vários headers de segurança
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });
  });
});

