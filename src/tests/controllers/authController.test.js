const request = require('supertest');
const express = require('express');
const { User, Cart } = global.testModels;
const authController = require('../../controllers/authController');
const { validateUserRegistration, validateLogin } = require('../../middleware/validation');

// Configurar app de teste
const app = express();
app.use(express.json());

// Rotas de teste
app.post('/register', validateUserRegistration, authController.register);
app.post('/login', validateLogin, authController.login);
app.get('/profile', require('../../middleware/auth').authenticateToken, authController.getProfile);
app.put('/profile', require('../../middleware/auth').authenticateToken, authController.updateProfile);

describe('Auth Controller', () => {
  describe('POST /register', () => {
    test('deve registrar um novo consumidor com sucesso', async () => {
      const userData = {
        nome: 'João Silva',
        email: 'joao@teste.com',
        senha: '123456',
        tipo: 'consumidor',
        telefone: '(11) 99999-9999'
      };

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.nome).toBe(userData.nome);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.tipo).toBe(userData.tipo);
      expect(response.body.data.user.senha).toBeUndefined();
      expect(response.body.data.token).toBeDefined();

      // Verificar se o carrinho foi criado para o consumidor
      const cart = await Cart.findOne({ where: { userId: response.body.data.user.id } });
      expect(cart).toBeTruthy();
    });

    test('deve registrar um novo produtor sem criar carrinho', async () => {
      const userData = {
        nome: 'Maria Santos',
        email: 'maria@teste.com',
        senha: '123456',
        tipo: 'produtor'
      };

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.tipo).toBe('produtor');

      // Verificar se o carrinho NÃO foi criado para o produtor
      const cart = await Cart.findOne({ where: { userId: response.body.data.user.id } });
      expect(cart).toBeFalsy();
    });

    test('deve falhar com dados inválidos', async () => {
      const userData = {
        nome: 'A',
        email: 'email-invalido',
        senha: '123'
      };

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('deve falhar com email já existente', async () => {
      const userData = {
        nome: 'Teste User',
        email: 'teste@teste.com',
        senha: '123456',
        tipo: 'consumidor'
      };

      // Criar primeiro usuário
      await User.create(userData);

      // Tentar criar segundo usuário com mesmo email
      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email já está em uso');
    });
  });

  describe('POST /login', () => {
    let user;

    beforeEach(async () => {
      user = await User.create({
        nome: 'Teste User',
        email: 'teste@teste.com',
        senha: '123456',
        tipo: 'consumidor'
      });
    });

    test('deve fazer login com credenciais válidas', async () => {
      const credentials = {
        email: 'teste@teste.com',
        senha: '123456'
      };

      const response = await request(app)
        .post('/login')
        .send(credentials)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(credentials.email);
      expect(response.body.data.user.senha).toBeUndefined();
      expect(response.body.data.token).toBeDefined();
    });

    test('deve falhar com email inexistente', async () => {
      const credentials = {
        email: 'inexistente@teste.com',
        senha: '123456'
      };

      const response = await request(app)
        .post('/login')
        .send(credentials)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email ou senha incorretos');
    });

    test('deve falhar com senha incorreta', async () => {
      const credentials = {
        email: 'teste@teste.com',
        senha: 'senha-errada'
      };

      const response = await request(app)
        .post('/login')
        .send(credentials)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email ou senha incorretos');
    });

    test('deve falhar com usuário desativado', async () => {
      await user.update({ ativo: false });

      const credentials = {
        email: 'teste@teste.com',
        senha: '123456'
      };

      const response = await request(app)
        .post('/login')
        .send(credentials)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Conta desativada');
    });

    test('deve falhar com dados inválidos', async () => {
      const credentials = {
        email: '',
        senha: ''
      };

      const response = await request(app)
        .post('/login')
        .send(credentials)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /profile', () => {
    let user, token;

    beforeEach(async () => {
      // Registrar usuário e obter token
      const userData = {
        nome: 'Teste User',
        email: 'teste@teste.com',
        senha: '123456',
        tipo: 'consumidor'
      };

      const registerResponse = await request(app)
        .post('/register')
        .send(userData);

      user = registerResponse.body.data.user;
      token = registerResponse.body.data.token;
    });

    test('deve retornar perfil do usuário autenticado', async () => {
      const response = await request(app)
        .get('/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(user.id);
      expect(response.body.data.email).toBe(user.email);
      expect(response.body.data.senha).toBeUndefined();
    });

    test('deve falhar sem token', async () => {
      const response = await request(app)
        .get('/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token de acesso requerido');
    });

    test('deve falhar com token inválido', async () => {
      const response = await request(app)
        .get('/profile')
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token inválido');
    });
  });

  describe('PUT /profile', () => {
    let user, token;

    beforeEach(async () => {
      const userData = {
        nome: 'Teste User',
        email: 'teste@teste.com',
        senha: '123456',
        tipo: 'consumidor'
      };

      const registerResponse = await request(app)
        .post('/register')
        .send(userData);

      user = registerResponse.body.data.user;
      token = registerResponse.body.data.token;
    });

    test('deve atualizar perfil do usuário', async () => {
      const updateData = {
        nome: 'Novo Nome',
        telefone: '(11) 88888-8888'
      };

      const response = await request(app)
        .put('/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nome).toBe(updateData.nome);
      expect(response.body.data.telefone).toBe(updateData.telefone);
    });

    test('deve falhar sem autenticação', async () => {
      const updateData = {
        nome: 'Novo Nome'
      };

      const response = await request(app)
        .put('/profile')
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});

