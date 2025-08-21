const { Address } = require('../models');
const { success, error, notFound, forbidden } = require('../utils/response');

/**
 * Controller de Endereços
 * Gerencia endereços dos usuários
 */

/**
 * Lista endereços do usuário logado
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
const getMyAddresses = async (req, res) => {
  try {
    const userId = req.user.id;

    const addresses = await Address.findAll({
      where: { userId },
      order: [['principal', 'DESC'], ['createdAt', 'ASC']]
    });

    return success(res, addresses, 'Endereços recuperados com sucesso');

  } catch (err) {
    console.error('Erro ao listar endereços:', err);
    return error(res, 'Erro interno do servidor');
  }
};

/**
 * Cria um novo endereço
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
const createAddress = async (req, res) => {
  try {
    const {
      rua,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      cep,
      principal
    } = req.body;

    const userId = req.user.id;

    // Se for endereço principal, remover principal dos outros
    if (principal) {
      await Address.update(
        { principal: false },
        { where: { userId } }
      );
    }

    const address = await Address.create({
      userId,
      rua,
      numero,
      complemento,
      bairro,
      cidade,
      estado: estado.toUpperCase(),
      cep,
      principal: principal || false
    });

    return success(res, address, 'Endereço criado com sucesso', 201);

  } catch (err) {
    console.error('Erro ao criar endereço:', err);
    return error(res, 'Erro interno do servidor');
  }
};

/**
 * Atualiza um endereço existente
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      rua,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      cep,
      principal
    } = req.body;

    const userId = req.user.id;

    // Buscar endereço
    const address = await Address.findByPk(id);
    if (!address) {
      return notFound(res, 'Endereço não encontrado');
    }

    // Verificar se pertence ao usuário
    if (address.userId !== userId) {
      return forbidden(res, 'Você só pode editar seus próprios endereços');
    }

    // Se for endereço principal, remover principal dos outros
    if (principal && !address.principal) {
      await Address.update(
        { principal: false },
        { where: { userId } }
      );
    }

    // Atualizar endereço
    const updateData = {};
    if (rua !== undefined) updateData.rua = rua;
    if (numero !== undefined) updateData.numero = numero;
    if (complemento !== undefined) updateData.complemento = complemento;
    if (bairro !== undefined) updateData.bairro = bairro;
    if (cidade !== undefined) updateData.cidade = cidade;
    if (estado !== undefined) updateData.estado = estado.toUpperCase();
    if (cep !== undefined) updateData.cep = cep;
    if (principal !== undefined) updateData.principal = principal;

    await address.update(updateData);

    return success(res, address, 'Endereço atualizado com sucesso');

  } catch (err) {
    console.error('Erro ao atualizar endereço:', err);
    return error(res, 'Erro interno do servidor');
  }
};

/**
 * Remove um endereço
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Buscar endereço
    const address = await Address.findByPk(id);
    if (!address) {
      return notFound(res, 'Endereço não encontrado');
    }

    // Verificar se pertence ao usuário
    if (address.userId !== userId) {
      return forbidden(res, 'Você só pode excluir seus próprios endereços');
    }

    await address.destroy();

    return success(res, null, 'Endereço removido com sucesso');

  } catch (err) {
    console.error('Erro ao remover endereço:', err);
    return error(res, 'Erro interno do servidor');
  }
};

/**
 * Define um endereço como principal
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
const setMainAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Buscar endereço
    const address = await Address.findByPk(id);
    if (!address) {
      return notFound(res, 'Endereço não encontrado');
    }

    // Verificar se pertence ao usuário
    if (address.userId !== userId) {
      return forbidden(res, 'Você só pode alterar seus próprios endereços');
    }

    // Remover principal dos outros endereços
    await Address.update(
      { principal: false },
      { where: { userId } }
    );

    // Definir como principal
    await address.update({ principal: true });

    return success(res, address, 'Endereço definido como principal');

  } catch (err) {
    console.error('Erro ao definir endereço principal:', err);
    return error(res, 'Erro interno do servidor');
  }
};

module.exports = {
  getMyAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setMainAddress
};

