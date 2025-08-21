const { User } = global.testModels;

describe('User Model', () => {
  describe('Criação de usuário', () => {
    test('deve criar um usuário consumidor válido', async () => {
      const userData = {
        nome: 'João Silva',
        email: 'joao@teste.com',
        senha: '123456',
        tipo: 'consumidor',
        telefone: '(11) 99999-9999'
      };

      const user = await User.create(userData);

      expect(user.id).toBeDefined();
      expect(user.nome).toBe(userData.nome);
      expect(user.email).toBe(userData.email);
      expect(user.tipo).toBe(userData.tipo);
      expect(user.telefone).toBe(userData.telefone);
      expect(user.ativo).toBe(true);
      expect(user.senha).not.toBe(userData.senha); // Senha deve estar criptografada
    });

    test('deve criar um usuário produtor válido', async () => {
      const userData = {
        nome: 'Maria Santos',
        email: 'maria@teste.com',
        senha: '123456',
        tipo: 'produtor'
      };

      const user = await User.create(userData);

      expect(user.tipo).toBe('produtor');
      expect(user.telefone).toBeNull();
    });

    test('deve usar tipo "consumidor" como padrão', async () => {
      const userData = {
        nome: 'Pedro Costa',
        email: 'pedro@teste.com',
        senha: '123456'
      };

      const user = await User.create(userData);

      expect(user.tipo).toBe('consumidor');
    });
  });

  describe('Validações', () => {
    test('deve falhar com nome muito curto', async () => {
      const userData = {
        nome: 'A',
        email: 'teste@teste.com',
        senha: '123456'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    test('deve falhar com email inválido', async () => {
      const userData = {
        nome: 'Teste User',
        email: 'email-invalido',
        senha: '123456'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    test('deve falhar com senha muito curta', async () => {
      const userData = {
        nome: 'Teste User',
        email: 'teste@teste.com',
        senha: '123'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    test('deve falhar com tipo inválido', async () => {
      const userData = {
        nome: 'Teste User',
        email: 'teste@teste.com',
        senha: '123456',
        tipo: 'admin'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    test('deve falhar com email duplicado', async () => {
      const userData = {
        nome: 'Teste User',
        email: 'teste@teste.com',
        senha: '123456'
      };

      await User.create(userData);

      await expect(User.create(userData)).rejects.toThrow();
    });

    test('deve falhar com telefone inválido', async () => {
      const userData = {
        nome: 'Teste User',
        email: 'teste@teste.com',
        senha: '123456',
        telefone: 'telefone-invalido'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe('Métodos do modelo', () => {
    let user;

    beforeEach(async () => {
      user = await User.create({
        nome: 'Teste User',
        email: 'teste@teste.com',
        senha: '123456'
      });
    });

    test('verificarSenha deve retornar true para senha correta', async () => {
      const isValid = await user.verificarSenha('123456');
      expect(isValid).toBe(true);
    });

    test('verificarSenha deve retornar false para senha incorreta', async () => {
      const isValid = await user.verificarSenha('senha-errada');
      expect(isValid).toBe(false);
    });

    test('toJSON deve remover a senha', () => {
      const userJson = user.toJSON();
      expect(userJson.senha).toBeUndefined();
      expect(userJson.nome).toBeDefined();
      expect(userJson.email).toBeDefined();
    });
  });

  describe('Hooks', () => {
    test('deve criptografar senha antes de criar', async () => {
      const userData = {
        nome: 'Teste User',
        email: 'teste@teste.com',
        senha: '123456'
      };

      const user = await User.create(userData);

      expect(user.senha).not.toBe('123456');
      expect(user.senha.length).toBeGreaterThan(20); // Hash bcrypt é longo
    });

    test('deve criptografar senha antes de atualizar', async () => {
      const user = await User.create({
        nome: 'Teste User',
        email: 'teste@teste.com',
        senha: '123456'
      });

      const senhaOriginal = user.senha;

      await user.update({ senha: 'nova-senha' });

      expect(user.senha).not.toBe('nova-senha');
      expect(user.senha).not.toBe(senhaOriginal);
    });

    test('não deve criptografar senha novamente se não foi alterada', async () => {
      const user = await User.create({
        nome: 'Teste User',
        email: 'teste@teste.com',
        senha: '123456'
      });

      const senhaOriginal = user.senha;

      await user.update({ nome: 'Novo Nome' });

      expect(user.senha).toBe(senhaOriginal);
    });
  });
});

