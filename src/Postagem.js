const { conectar } = require('./database');
const { registrar } = require('./logger');
const { ObjectId } = require('mongodb');

class Postagem {
  constructor({ titulo, conteudo, autorId }) {
    if (!titulo || !conteudo || !autorId) {
      throw new Error('Campos obrigatórios: titulo, conteudo, autorId');
    }
    this.titulo = titulo;
    this.conteudo = conteudo;
    this.autorId = new ObjectId(autorId);
    this.curtidas = 0;
    this.criadoEm = new Date();
  }

  // CREATE
  static async inserir(dados) {
    try {
      const db = await conectar();
      const postagem = new Postagem(dados);
      const resultado = await db.collection('postagens').insertOne(postagem);
      return resultado;
    } catch (erro) {
      registrar('Falha ao inserir postagem', 'Postagem.inserir', erro.message);
      throw erro;
    }
  }

  // READ - listar todas
  static async listar() {
    try {
      const db = await conectar();
      return await db.collection('postagens').find().sort({ criadoEm: -1 }).toArray();
    } catch (erro) {
      registrar('Falha ao listar postagens', 'Postagem.listar', erro.message);
      throw erro;
    }
  }

  // READ - buscar por ID
  static async buscarPorId(id) {
    try {
      const db = await conectar();
      const postagem = await db.collection('postagens').findOne({ _id: new ObjectId(id) });
      if (!postagem) throw new Error(`Postagem com id "${id}" não encontrada`);
      return postagem;
    } catch (erro) {
      registrar('Falha ao buscar postagem', 'Postagem.buscarPorId', erro.message);
      throw erro;
    }
  }

  // READ - buscar por autor
  static async buscarPorAutor(autorId) {
    try {
      const db = await conectar();
      return await db.collection('postagens')
        .find({ autorId: new ObjectId(autorId) })
        .sort({ criadoEm: -1 })
        .toArray();
    } catch (erro) {
      registrar('Falha ao buscar postagens por autor', 'Postagem.buscarPorAutor', erro.message);
      throw erro;
    }
  }

  // READ - buscar por palavra-chave no título ou conteúdo
  static async buscar(termo) {
    try {
      const db = await conectar();
      const regex = new RegExp(termo, 'i');
      return await db.collection('postagens')
        .find({ $or: [{ titulo: regex }, { conteudo: regex }] })
        .toArray();
    } catch (erro) {
      registrar('Falha ao buscar postagens', 'Postagem.buscar', erro.message);
      throw erro;
    }
  }

  // UPDATE
  static async atualizar(id, dados) {
    try {
      const db = await conectar();
      const resultado = await db.collection('postagens').updateOne(
        { _id: new ObjectId(id) },
        { $set: dados }
      );
      if (resultado.matchedCount === 0) throw new Error(`Postagem com id "${id}" não encontrada`);
      return resultado;
    } catch (erro) {
      registrar('Falha ao atualizar postagem', 'Postagem.atualizar', erro.message);
      throw erro;
    }
  }

  // DELETE
  static async excluir(id) {
    try {
      const db = await conectar();
      const resultado = await db.collection('postagens').deleteOne({ _id: new ObjectId(id) });
      if (resultado.deletedCount === 0) throw new Error(`Postagem com id "${id}" não encontrada`);
      return resultado;
    } catch (erro) {
      registrar('Falha ao excluir postagem', 'Postagem.excluir', erro.message);
      throw erro;
    }
  }
}

module.exports = Postagem;
