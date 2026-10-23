const { conectar, desconectar } = require('./database');
const { registrar } = require('./logger');
const Usuario = require('./Usuario');
const Postagem = require('./Postagem');
const Comentario = require('./Comentario');

async function main() {
  try {
    console.log('=== MICROBLOGGING — DEMO ===\n');

    const db = await conectar();
    await db.collection('usuarios').deleteMany({ email: { $in: ['ana@email.com', 'bruno@email.com'] } });

    // --- USUÁRIOS ---
    console.log('>> Inserindo usuários...');
    const u1 = await Usuario.inserir({ nome: 'Ana Silva', email: 'ana@email.com', senha: 'Ana12345', bio: 'Dev apaixonada por JS' });
    const u2 = await Usuario.inserir({ nome: 'Bruno Melo', email: 'bruno@email.com', senha: 'Bruno123', bio: 'Entusiasta de tech' });
    const idAna = u1.insertedId.toString();
    const idBruno = u2.insertedId.toString();
    console.log('Usuários inseridos:', idAna, idBruno);

    // --- POSTAGENS ---
    console.log('\n>> Inserindo postagens...');
    const p1 = await Postagem.inserir({ titulo: 'Aprendendo Node.js', conteudo: 'Node.js é incrível para back-end!', autorId: idAna });
    const p2 = await Postagem.inserir({ titulo: 'MongoDB é NoSQL', conteudo: 'Trabalhando com documentos é muito flexível.', autorId: idBruno });
    const idP1 = p1.insertedId.toString();
    const idP2 = p2.insertedId.toString();
    console.log('Postagens inseridas:', idP1, idP2);

    // --- COMENTÁRIOS ---
    console.log('\n>> Inserindo comentários...');
    const c1 = await Comentario.inserir({ conteudo: 'Ótimo post!', autorId: idBruno, postagemId: idP1 });
    const c2 = await Comentario.inserir({ conteudo: 'Concordo totalmente!', autorId: idAna, postagemId: idP2 });
    console.log('Comentários inseridos:', c1.insertedId, c2.insertedId);

    // --- CONSULTAS ---
    console.log('\n>> Listando todos os usuários:');
    const usuarios = await Usuario.listar();
    usuarios.forEach(u => console.log(` - ${u.nome} (${u.email})`));

    console.log('\n>> Buscando postagens com "Node":');
    const resultados = await Postagem.buscar('Node');
    resultados.forEach(p => console.log(` - ${p.titulo}`));

    console.log('\n>> Comentários da postagem 1:');
    const comentarios = await Comentario.listarPorPostagem(idP1);
    comentarios.forEach(c => console.log(` - ${c.conteudo}`));

    // --- ATUALIZAÇÃO ---
    console.log('\n>> Atualizando bio da Ana...');
    await Usuario.atualizar(idAna, { bio: 'Desenvolvedora Full-Stack' });
    const anaAtualizada = await Usuario.buscarPorId(idAna);
    console.log('Bio atualizada:', anaAtualizada.bio);

    // --- EXCLUSÃO ---
    console.log('\n>> Excluindo comentário c2...');
    await Comentario.excluir(c2.insertedId.toString());
    console.log('Comentário excluído com sucesso.');

    // --- TESTE DE ERRO (validação) ---
    console.log('\n>> Testando validação (sem campos obrigatórios)...');
    try {
      await Usuario.inserir({ nome: 'Sem Email' });
    } catch (erro) {
      console.log('Erro capturado (campos faltando):', erro.message);
    }

    console.log('\n>> Testando validação (senha fraca)...');
    try {
      await Usuario.inserir({ nome: 'Teste', email: 'teste@email.com', senha: '123456' });
    } catch (erro) {
      console.log('Erro capturado (senha fraca):', erro.message);
    }

    console.log('\n>> Testando validação (email inválido)...');
    try {
      await Usuario.inserir({ nome: 'Teste', email: 'emailinvalido', senha: 'Teste123' });
    } catch (erro) {
      console.log('Erro capturado (email inválido):', erro.message);
    }

    console.log('\n=== DEMO CONCLUÍDA ===');
  } catch (erro) {
    registrar('Erro geral na aplicação', 'main', erro.message);
    console.error('Erro fatal:', erro.message);
  } finally {
    await desconectar();
  }
}

main();
