const { conectar } = require('./database');
const { registrar } = require('./logger');
const { ObjectId } = require('mongodb');

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_SENHA = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;

class Usuario {
  constructor({ nome, email, senha, bio = '' }) {
    if (!nome || !email || !senha) throw new Error('Campos obrigatórios: nome, email, senha');
    if (!REGEX_EMAIL.test(email)) throw new Error('E-mail inválido');
    if (!REGEX_SENHA.test(senha)) throw new Error('Senha deve ter mínimo 8 caracteres, ao menos 1 letra e 1 número');
    this.nome = nome;
    this.email = email;
    this.senha = senha;
    this.bio = bio;
    this.criadoEm = new Date();
  }

  // CREATE
  static async inserir(dados) {
    try {
      const db = await conectar();
      const usuario = new Usuario(dados);
      const resultado = await db.collection('usuarios').insertOne(usuario);
      return resultado;
    } catch (erro) {
      if (erro.code === 11000) erro.message = 'E-mail já cadastrado';
      registrar('Falha ao inserir usuário', 'Usuario.inserir', erro.message);
      throw erro;
    }
  }

  // READ - listar todos
  static async listar() {
    try {
      const db = await conectar();
      return await db.collection('usuarios').find().toArray();
    } catch (erro) {
      registrar('Falha ao listar usuários', 'Usuario.listar', erro.message);
      throw erro;
    }
  }

  // READ - buscar por ID
  static async buscarPorId(id) {
    try {
      const db = await conectar();
      const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(id) });
      if (!usuario) throw new Error(`Usuário com id "${id}" não encontrado`);
      return usuario;
    } catch (erro) {
      registrar('Falha ao buscar usuário', 'Usuario.buscarPorId', erro.message);
      throw erro;
    }
  }

  // READ - buscar por email
  static async buscarPorEmail(email) {
    try {
      const db = await conectar();
      const usuario = await db.collection('usuarios').findOne({ email });
      if (!usuario) throw new Error(`Usuário com email "${email}" não encontrado`);
      return usuario;
    } catch (erro) {
      registrar('Falha ao buscar usuário por email', 'Usuario.buscarPorEmail', erro.message);
      throw erro;
    }
  }

  // Autenticar (login)
  static async autenticar(email, senha) {
    const usuario = await Usuario.buscarPorEmail(email);
    if (usuario.senha !== senha) throw new Error('Senha incorreta');
    return usuario;
  }

  // UPDATE
  static async atualizar(id, dados) {
    try {
      const db = await conectar();
      const resultado = await db.collection('usuarios').updateOne(
        { _id: new ObjectId(id) },
        { $set: dados }
      );
      if (resultado.matchedCount === 0) throw new Error(`Usuário com id "${id}" não encontrado`);
      return resultado;
    } catch (erro) {
      registrar('Falha ao atualizar usuário', 'Usuario.atualizar', erro.message);
      throw erro;
    }
  }

  // DELETE
  static async excluir(id) {
    try {
      const db = await conectar();
      const resultado = await db.collection('usuarios').deleteOne({ _id: new ObjectId(id) });
      if (resultado.deletedCount === 0) throw new Error(`Usuário com id "${id}" não encontrado`);
      return resultado;
    } catch (erro) {
      registrar('Falha ao excluir usuário', 'Usuario.excluir', erro.message);
      throw erro;
    }
  }
}

module.exports = Usuario;
