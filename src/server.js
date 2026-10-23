const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const Usuario = require('./Usuario');
const Postagem = require('./Postagem');
const Comentario = require('./Comentario');
const { conectar } = require('./database');
const { registrar } = require('./logger');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const VISITANTE = {
  nome: 'Visitante',
  email: 'visitante@sistema.com',
  senha: 'Visitante123',
  bio: 'Usuário padrão visitante'
};

async function ensureVisitante() {
  const db = await conectar();
  const existente = await db.collection('usuarios').findOne({ email: VISITANTE.email });
  if (!existente) {
    await Usuario.inserir(VISITANTE);
  }
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('JSON inválido'));
      }
    });
    req.on('error', reject);
  });
}

function serveStatic(res, filePath, contentType) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Arquivo não encontrado');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  try {
    // --- ROTAS DA API ---
    // Listar usuários (Visitante sempre como primeiro)
    if (pathname === '/api/usuarios' && method === 'GET') {
      await ensureVisitante();
      const usuarios = await Usuario.listar();
      usuarios.sort((a, b) => {
        if (a.email === VISITANTE.email) return -1;
        if (b.email === VISITANTE.email) return 1;
        return 0;
      });
      return sendJson(res, 200, usuarios);
    }

    // Login (autenticar por email + senha)
    if (pathname === '/api/login' && method === 'POST') {
      const body = await parseBody(req);
      const usuario = await Usuario.autenticar(body.email, body.senha);
      return sendJson(res, 200, { _id: usuario._id, nome: usuario.nome, email: usuario.email, bio: usuario.bio });
    }

    // Criar usuário
    if (pathname === '/api/usuarios' && method === 'POST') {
      const body = await parseBody(req);
      const resultado = await Usuario.inserir(body);
      return sendJson(res, 201, { id: resultado.insertedId, ...body });
    }

    // Excluir usuário selecionado
    if (pathname === '/api/usuarios' && method === 'DELETE') {
      const id = (parsedUrl.query.id || '').trim();
      if (!id) return sendJson(res, 400, { erro: 'ID do usuário é obrigatório' });

      const { ObjectId } = require('mongodb');
      if (!ObjectId.isValid(id)) {
        return sendJson(res, 400, { erro: 'ID de usuário inválido' });
      }

      const usuario = await Usuario.buscarPorId(id);
      if (!usuario) return sendJson(res, 404, { erro: 'Usuário não encontrado' });

      if (usuario.email === VISITANTE.email) {
        return sendJson(res, 400, { erro: 'O usuário Visitante não pode ser excluído' });
      }

      await Usuario.excluir(id);

      const db = await conectar();
      await db.collection('postagens').deleteMany({ autorId: id });
      await db.collection('comentarios').deleteMany({ autorId: id });

      return sendJson(res, 200, { mensagem: 'Usuário excluído com sucesso' });
    }

    // Listar ou buscar postagens
    if (pathname === '/api/postagens' && method === 'GET') {
      const termo = parsedUrl.query.busca;
      const autorId = parsedUrl.query.autorId;
      let postagens;

      if (termo) {
        postagens = await Postagem.buscar(termo);
      } else if (autorId) {
        postagens = await Postagem.buscarPorAutor(autorId);
      } else {
        postagens = await Postagem.listar();
      }
      return sendJson(res, 200, postagens);
    }

    // Criar postagem
    if (pathname === '/api/postagens' && method === 'POST') {
      const body = await parseBody(req);
      const resultado = await Postagem.inserir(body);
      return sendJson(res, 201, { id: resultado.insertedId, ...body });
    }

    // Excluir postagem
    if (pathname === '/api/postagens' && method === 'DELETE') {
      const id = parsedUrl.query.id;
      if (!id) return sendJson(res, 400, { erro: 'ID da postagem é obrigatório' });
      await Postagem.excluir(id);
      return sendJson(res, 200, { mensagem: 'Postagem excluída com sucesso' });
    }

    // Listar comentários por postagem
    if (pathname === '/api/comentarios' && method === 'GET') {
      const postagemId = parsedUrl.query.postagemId;
      if (!postagemId) return sendJson(res, 400, { erro: 'postagemId é obrigatório' });
      const comentarios = await Comentario.listarPorPostagem(postagemId);
      return sendJson(res, 200, comentarios);
    }

    // Criar comentário
    if (pathname === '/api/comentarios' && method === 'POST') {
      const body = await parseBody(req);
      const resultado = await Comentario.inserir(body);
      return sendJson(res, 201, { id: resultado.insertedId, ...body });
    }

    // Excluir comentário
    if (pathname === '/api/comentarios' && method === 'DELETE') {
      const id = parsedUrl.query.id;
      if (!id) return sendJson(res, 400, { erro: 'ID do comentário é obrigatório' });
      await Comentario.excluir(id);
      return sendJson(res, 200, { mensagem: 'Comentário excluído com sucesso' });
    }

    // Reset do banco de dados (mantém o Visitante de forma fixa)
    if (pathname === '/api/reset' && method === 'POST') {
      const db = await conectar();
      await db.collection('usuarios').deleteMany({});
      await db.collection('postagens').deleteMany({});
      await db.collection('comentarios').deleteMany({});
      await ensureVisitante();
      return sendJson(res, 200, { mensagem: 'Banco de dados resetado com sucesso' });
    }

    // --- ARQUIVOS ESTÁTICOS ---
    if (pathname === '/' || pathname === '/index.html') {
      return serveStatic(res, path.join(PUBLIC_DIR, 'index.html'), 'text/html; charset=utf-8');
    }
    if (pathname === '/style.css') {
      return serveStatic(res, path.join(PUBLIC_DIR, 'style.css'), 'text/css; charset=utf-8');
    }
    if (pathname === '/app.js') {
      return serveStatic(res, path.join(PUBLIC_DIR, 'app.js'), 'application/javascript; charset=utf-8');
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Página não encontrada');
  } catch (erro) {
    registrar('Erro no servidor web', req.url, erro.message);
    sendJson(res, 500, { erro: erro.message });
  }
});

async function iniciar() {
  const db = await conectar();
  try {
    await db.collection('usuarios').createIndex({ email: 1 }, { unique: true });
  } catch (err) {
    try {
      await db.collection('usuarios').dropIndexes();
      await db.collection('usuarios').createIndex({ email: 1 }, { unique: true });
    } catch (_) {}
  }
  await ensureVisitante();

  server.listen(PORT, () => {
    console.log(`\n===========================================`);
    console.log(` Servidor rodando em: http://localhost:${PORT}`);
    console.log(` Abra o link acima no navegador para ver o site!`);
    console.log(` Pressione Ctrl+C para encerrar.`);
    console.log(`===========================================\n`);
  });
}

iniciar().catch(err => {
  console.error('Falha ao iniciar o servidor:', err.message);
});
