const { conectar } = require('./database');
const { registrar } = require('./logger');
const { ObjectId } = require('mongodb');

class Comentario {
  constructor({ conteudo, autorId, postagemId }) {
    if (!conteudo || !autorId || !postagemId) {
      throw new Error('Campos obrigatórios: conteudo, autorId, postagemId');
    }
    this.conteudo = conteudo;
    this.autorId = new ObjectId(autorId);
    this.postagemId = new ObjectId(postagemId);
    this.criadoEm = new Date();
  }

  // CREATE
  static async inserir(dados) {
    try {
      const db = await conectar();
      const comentario = new Comentario(dados);
      const resultado = await db.collection('comentarios').insertOne(comentario);
      return resultado;
    } catch (erro) {
      registrar('Falha ao inserir comentário', 'Comentario.inserir', erro.message);
      throw erro;
    }
  }

  // READ - listar por postagem
  static async listarPorPostagem(postagemId) {
    try {
      const db = await conectar();
      return await db.collection('comentarios')
        .find({ postagemId: new ObjectId(postagemId) })
        .sort({ criadoEm: 1 })
        .toArray();
    } catch (erro) {
      registrar('Falha ao listar comentários', 'Comentario.listarPorPostagem', erro.message);
      throw erro;
    }
  }

  // READ - buscar por ID
  static async buscarPorId(id) {
    try {
      const db = await conectar();
      const comentario = await db.collection('comentarios').findOne({ _id: new ObjectId(id) });
      if (!comentario) throw new Error(`Comentário com id "${id}" não encontrado`);
      return comentario;
    } catch (erro) {
      registrar('Falha ao buscar comentário', 'Comentario.buscarPorId', erro.message);
      throw erro;
    }
  }

  // UPDATE
  static async atualizar(id, dados) {
    try {
      const db = await conectar();
      const resultado = await db.collection('comentarios').updateOne(
        { _id: new ObjectId(id) },
        { $set: dados }
      );
      if (resultado.matchedCount === 0) throw new Error(`Comentário com id "${id}" não encontrado`);
      return resultado;
    } catch (erro) {
      registrar('Falha ao atualizar comentário', 'Comentario.atualizar', erro.message);
      throw erro;
    }
  }

  // DELETE
  static async excluir(id) {
    try {
      const db = await conectar();
      const resultado = await db.collection('comentarios').deleteOne({ _id: new ObjectId(id) });
      if (resultado.deletedCount === 0) throw new Error(`Comentário com id "${id}" não encontrado`);
      return resultado;
    } catch (erro) {
      registrar('Falha ao excluir comentário', 'Comentario.excluir', erro.message);
      throw erro;
    }
  }
}

module.exports = Comentario;
