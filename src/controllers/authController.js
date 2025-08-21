const { User, Cart } = require('../models');
const { generateToken } = require('../utils/jwt');
const { success, error, validationError, unauthorized, conflict } = require('../utils/response');

/**
 * Controller de Autenticação
 * Gerencia registro, login e operações relacionadas à autenticação
 */

/**
 * Registra um novo usuário
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
const register = async (req, res) => {
  try {
    const { nome, email, senha, tipo, telefone } = req.body;

    // Verificar se o email já existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return conflict(res, 'Email já está em uso');
    }

    // Criar o usuário
    const user = await User.create({
      nome,
      email,
      senha,
      tipo,
      telefone
    });

    // Criar carrinho para consumidores
    if (tipo === 'consumidor') {
      await Cart.create({ userId: user.id });
    }

    // Gerar token
    const token = generateToken(user);

    return success(res, {
      user: user.toJSON(),
      token
    }, 'Usuário registrado com sucesso', 201);

  } catch (err) {
    console.error('Erro no registro:', err);
    return error(res, 'Erro interno do servidor');
  }
};

/**
 * Realiza login do usuário
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
const login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Buscar usuário pelo email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return unauthorized(res, 'Email ou senha incorretos');
    }

    // Verificar se o usuário está ativo
    if (!user.ativo) {
      return unauthorized(res, 'Conta desativada');
    }

    // Verificar senha
    const senhaValida = await user.verificarSenha(senha);
    if (!senhaValida) {
      return unauthorized(res, 'Email ou senha incorretos');
    }

    // Gerar token
    const token = generateToken(user);

    return success(res, {
      user: user.toJSON(),
      token
    }, 'Login realizado com sucesso');

  } catch (err) {
    console.error('Erro no login:', err);
    return error(res, 'Erro interno do servidor');
  }
};

/**
 * Obtém o perfil do usuário logado
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        {
          association: 'enderecos',
          where: { principal: true },
          required: false
        }
      ]
    });

    return success(res, user, 'Perfil recuperado com sucesso');

  } catch (err) {
    console.error('Erro ao buscar perfil:', err);
    return error(res, 'Erro interno do servidor');
  }
};

/**
 * Atualiza o perfil do usuário logado
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
const updateProfile = async (req, res) => {
  try {
    const { nome, telefone } = req.body;
    const userId = req.user.id;

    // Atualizar apenas os campos permitidos
    const updateData = {};
    if (nome) updateData.nome = nome;
    if (telefone) updateData.telefone = telefone;

    await User.update(updateData, {
      where: { id: userId }
    });

    // Buscar usuário atualizado
    const updatedUser = await User.findByPk(userId);

    return success(res, updatedUser, 'Perfil atualizado com sucesso');

  } catch (err) {
    console.error('Erro ao atualizar perfil:', err);
    return error(res, 'Erro interno do servidor');
  }
};

/**
 * Altera a senha do usuário
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
const changePassword = async (req, res) => {
  try {
    const { senhaAtual, novaSenha } = req.body;
    const userId = req.user.id;

    // Validar dados
    if (!senhaAtual || !novaSenha) {
      return validationError(res, ['Senha atual e nova senha são obrigatórias']);
    }

    if (novaSenha.length < 6) {
      return validationError(res, ['Nova senha deve ter pelo menos 6 caracteres']);
    }

    // Buscar usuário
    const user = await User.findByPk(userId);

    // Verificar senha atual
    const senhaValida = await user.verificarSenha(senhaAtual);
    if (!senhaValida) {
      return unauthorized(res, 'Senha atual incorreta');
    }

    // Atualizar senha
    await user.update({ senha: novaSenha });

    return success(res, null, 'Senha alterada com sucesso');

  } catch (err) {
    console.error('Erro ao alterar senha:', err);
    return error(res, 'Erro interno do servidor');
  }
};

/**
 * Desativa a conta do usuário
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
const deactivateAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    await User.update(
      { ativo: false },
      { where: { id: userId } }
    );

    return success(res, null, 'Conta desativada com sucesso');

  } catch (err) {
    console.error('Erro ao desativar conta:', err);
    return error(res, 'Erro interno do servidor');
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  deactivateAccount
};

