let usuarios = [];
let usuarioSelecionadoId = '';

const selectUsuario = document.getElementById('select-usuario');
const btnExcluirUsuario = document.getElementById('btn-excluir-usuario');
const btnModalExcluir = document.getElementById('btn-modal-excluir');
const formUsuario = document.getElementById('form-usuario');
const formPostagem = document.getElementById('form-postagem');
const campoBusca = document.getElementById('campo-busca');
const btnBuscar = document.getElementById('btn-buscar');
const btnLimparBusca = document.getElementById('btn-limpar-busca');
const listaPostagens = document.getElementById('lista-postagens');
const mensagemBox = document.getElementById('mensagem');
const modalLogin = document.getElementById('modal-login');
const modalInfo = document.getElementById('modal-login-info');
const modalEmail = document.getElementById('modal-email');
const modalSenha = document.getElementById('modal-senha');

function mostrarAviso(texto, isErro = false) {
  mensagemBox.textContent = texto;
  mensagemBox.style.display = 'block';
  mensagemBox.style.background = isErro ? '#fce8e6' : '#e6f4ea';
  mensagemBox.style.color = isErro ? '#c5221f' : '#137333';
  setTimeout(() => {
    mensagemBox.style.display = 'none';
  }, 4000);
}

// 1. CARREGAR USUÁRIOS
async function carregarUsuarios() {
  try {
    const res = await fetch('/api/usuarios');
    usuarios = await res.json();

    selectUsuario.innerHTML = '';
    if (usuarios.length === 0) {
      selectUsuario.innerHTML = '<option value="">Nenhum usuário cadastrado</option>';
      return;
    }

    usuarios.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u._id;
      opt.textContent = `${u.nome} (${u.email})`;
      selectUsuario.appendChild(opt);
    });

    if (!usuarioSelecionadoId && usuarios.length > 0) {
      usuarioSelecionadoId = usuarios[0]._id;
    } else if (usuarioSelecionadoId) {
      const existe = usuarios.some(u => u._id === usuarioSelecionadoId);
      if (!existe && usuarios.length > 0) {
        usuarioSelecionadoId = usuarios[0]._id;
      }
    }

    if (usuarioSelecionadoId) {
      selectUsuario.value = usuarioSelecionadoId;
    }
  } catch (err) {
    mostrarAviso('Erro ao carregar usuários: ' + err.message, true);
  }
}

selectUsuario.addEventListener('change', (e) => {
  const novoId = e.target.value;
  const usuario = usuarios.find(u => u._id === novoId);
  if (!usuario) return;

  // Visitante é o usuário padrão/público, não exige senha para ativar
  if (usuario.email === 'visitante@sistema.com') {
    usuarioSelecionadoId = usuario._id;
    modalLogin.style.display = 'none';
    mostrarAviso(`Usuário ativo: ${usuario.nome}`);
    return;
  }

  // Exibe modal de login para confirmar identidade
  modalInfo.textContent = `Identifique-se como ${usuario.nome} (${usuario.email})`;
  modalEmail.value = usuario.email;
  modalSenha.value = '';
  modalLogin.style.display = 'flex';
  modalEmail.focus();
});

// Modal: ver/ocultar senha
document.getElementById('btn-ver-senha').addEventListener('click', () => {
  modalSenha.type = modalSenha.type === 'password' ? 'text' : 'password';
});

// Modal: cancelar (reverte select)
document.getElementById('btn-cancelar-login').addEventListener('click', () => {
  modalLogin.style.display = 'none';
  selectUsuario.value = usuarioSelecionadoId;
});

// Modal: confirmar login
document.getElementById('btn-confirmar-login').addEventListener('click', async () => {
  const email = modalEmail.value.trim();
  const senha = modalSenha.value;
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });
    const dados = await res.json();
    if (!res.ok) throw new Error(dados.erro || 'Falha no login');

    usuarioSelecionadoId = dados._id;
    selectUsuario.value = usuarioSelecionadoId;
    modalLogin.style.display = 'none';
    mostrarAviso(`Bem-vindo(a), ${dados.nome}!`);
  } catch (err) {
    mostrarAviso(err.message, true);
  }
});

// 2. CADASTRAR NOVO USUÁRIO
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_SENHA = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;

formUsuario.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nome = document.getElementById('user-nome').value.trim();
  const email = document.getElementById('user-email').value.trim();
  const senha = document.getElementById('user-senha').value;
  const bio = document.getElementById('user-bio').value.trim();

  if (!REGEX_EMAIL.test(email)) return mostrarAviso('E-mail inválido.', true);
  if (!REGEX_SENHA.test(senha)) return mostrarAviso('Senha deve ter mínimo 8 caracteres, ao menos 1 letra e 1 número.', true);
  try {
    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha, bio })
    });
    const dados = await res.json();
    if (!res.ok) throw new Error(dados.erro || 'Falha ao cadastrar usuário');

    mostrarAviso(`Usuário ${nome} criado com sucesso!`);
    formUsuario.reset();
    usuarioSelecionadoId = dados.id;
    await carregarUsuarios();
  } catch (err) {
    mostrarAviso(err.message, true);
  }
});

// 3. PUBLICAR POSTAGEM
formPostagem.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!usuarioSelecionadoId) {
    return mostrarAviso('Cadastre ou selecione um usuário autor antes de postar!', true);
  }

  const titulo = document.getElementById('post-titulo').value.trim();
  const conteudo = document.getElementById('post-conteudo').value.trim();

  try {
    const res = await fetch('/api/postagens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, conteudo, autorId: usuarioSelecionadoId })
    });
    const dados = await res.json();
    if (!res.ok) throw new Error(dados.erro || 'Falha ao publicar postagem');

    mostrarAviso('Postagem publicada!');
    formPostagem.reset();
    carregarPostagens();
  } catch (err) {
    mostrarAviso(err.message, true);
  }
});

// 4. CARREGAR POSTAGENS
async function carregarPostagens(termo = '') {
  try {
    const url = termo ? `/api/postagens?busca=${encodeURIComponent(termo)}` : '/api/postagens';
    const res = await fetch(url);
    const postagens = await res.json();

    if (!Array.isArray(postagens) || postagens.length === 0) {
      listaPostagens.innerHTML = '<p>Nenhuma postagem encontrada.</p>';
      return;
    }

    listaPostagens.innerHTML = '';
    for (const post of postagens) {
      const autor = usuarios.find(u => u._id === post.autorId);
      const nomeAutor = autor ? autor.nome : 'Autor desconhecido';
      const dataCriacao = post.criadoEm ? new Date(post.criadoEm).toLocaleString('pt-BR') : '';

      const postDiv = document.createElement('div');
      postDiv.className = 'post-item';
      postDiv.innerHTML = `
        <h3 style="margin-bottom: 4px;">${escapeHtml(post.titulo)}</h3>
        <div class="post-meta">
          Por <strong>${escapeHtml(nomeAutor)}</strong> em ${dataCriacao}
          &bull; <button type="button" class="btn-danger btn-excluir-post" data-id="${post._id}">Excluir Post</button>
        </div>
        <p style="margin: 8px 0;">${escapeHtml(post.conteudo)}</p>
        
        <div class="comentarios-secao">
          <strong>Comentários:</strong>
          <div id="comentarios-${post._id}" style="margin: 8px 0;"><small>Carregando comentários...</small></div>
          <form class="form-comentario" data-postid="${post._id}" style="display: flex; gap: 8px; margin-top: 8px;">
            <input type="text" placeholder="Escreva um comentário..." required style="flex: 1;">
            <button type="submit" style="margin-top: 0; padding: 6px 12px; font-size: 13px;">Comentar</button>
          </form>
        </div>
      `;
      listaPostagens.appendChild(postDiv);

      carregarComentarios(post._id);
    }
  } catch (err) {
    listaPostagens.innerHTML = `<p style="color:red">Erro ao carregar postagens: ${err.message}</p>`;
  }
}

// 5. CARREGAR COMENTÁRIOS DE UMA POSTAGEM
async function carregarComentarios(postagemId) {
  const container = document.getElementById(`comentarios-${postagemId}`);
  if (!container) return;

  try {
    const res = await fetch(`/api/comentarios?postagemId=${postagemId}`);
    const comentarios = await res.json();

    if (!Array.isArray(comentarios) || comentarios.length === 0) {
      container.innerHTML = '<small style="color:#777;">Nenhum comentário ainda.</small>';
      return;
    }

    container.innerHTML = '';
    comentarios.forEach(c => {
      const autor = usuarios.find(u => u._id === c.autorId);
      const nomeAutor = autor ? autor.nome : 'Anônimo';

      const item = document.createElement('div');
      item.className = 'comentario-item';
      item.innerHTML = `
        <span><strong>${escapeHtml(nomeAutor)}:</strong> ${escapeHtml(c.conteudo)}</span>
        <button type="button" class="btn-danger btn-excluir-comentario" data-id="${c._id}">X</button>
      `;
      container.appendChild(item);
    });
  } catch (err) {
    container.innerHTML = `<small style="color:red">Erro ao carregar comentários.</small>`;
  }
}

// 6. EVENTOS DE DELEGAÇÃO (Comentar, Excluir Post, Excluir Comentário)
listaPostagens.addEventListener('submit', async (e) => {
  if (e.target.classList.contains('form-comentario')) {
    e.preventDefault();
    if (!usuarioSelecionadoId) {
      return mostrarAviso('Selecione um usuário autor antes de comentar!', true);
    }

    const postagemId = e.target.getAttribute('data-postid');
    const input = e.target.querySelector('input');
    const conteudo = input.value.trim();

    try {
      const res = await fetch('/api/comentarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conteudo, autorId: usuarioSelecionadoId, postagemId })
      });
      const dados = await res.json();
      if (!res.ok) throw new Error(dados.erro || 'Falha ao adicionar comentário');

      input.value = '';
      carregarComentarios(postagemId);
    } catch (err) {
      mostrarAviso(err.message, true);
    }
  }
});

listaPostagens.addEventListener('click', async (e) => {
  if (e.target.classList.contains('btn-excluir-post')) {
    const id = e.target.getAttribute('data-id');
    if (!confirm('Deseja realmente excluir esta postagem?')) return;

    try {
      const res = await fetch(`/api/postagens?id=${id}`, { method: 'DELETE' });
      const dados = await res.json();
      if (!res.ok) throw new Error(dados.erro || 'Falha ao excluir postagem');

      mostrarAviso('Postagem excluída!');
      carregarPostagens(campoBusca.value.trim());
    } catch (err) {
      mostrarAviso(err.message, true);
    }
  }

  if (e.target.classList.contains('btn-excluir-comentario')) {
    const id = e.target.getAttribute('data-id');
    try {
      const res = await fetch(`/api/comentarios?id=${id}`, { method: 'DELETE' });
      const dados = await res.json();
      if (!res.ok) throw new Error(dados.erro || 'Falha ao excluir comentário');

      mostrarAviso('Comentário excluído!');
      const postagemItem = e.target.closest('.post-item');
      const form = postagemItem.querySelector('.form-comentario');
      const postagemId = form.getAttribute('data-postid');
      carregarComentarios(postagemId);
    } catch (err) {
      mostrarAviso(err.message, true);
    }
  }
});

// 7. BUSCA
btnBuscar.addEventListener('click', () => {
  const termo = campoBusca.value.trim();
  carregarPostagens(termo);
});

btnLimparBusca.addEventListener('click', () => {
  campoBusca.value = '';
  carregarPostagens();
});

campoBusca.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    carregarPostagens(campoBusca.value.trim());
  }
});

function escapeHtml(texto) {
  if (!texto) return '';
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 8. EXCLUIR USUÁRIO SELECIONADO
async function excluirUsuarioPorId(id) {
  if (!id) {
    return mostrarAviso('Nenhum usuário selecionado para exclusão.', true);
  }

  const usuario = usuarios.find(u => u._id === id);
  if (!usuario) {
    return mostrarAviso('Usuário não encontrado.', true);
  }

  if (usuario.email === 'visitante@sistema.com') {
    return mostrarAviso('O usuário Visitante é fixo e não pode ser excluído.', true);
  }

  if (!confirm(`Tem certeza que deseja excluir o usuário "${usuario.nome}" (${usuario.email})?`)) {
    return;
  }

  try {
    const res = await fetch(`/api/usuarios?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    const dados = await res.json();
    if (!res.ok) throw new Error(dados.erro || 'Falha ao excluir usuário');

    modalLogin.style.display = 'none';
    await carregarUsuarios();

    // Ao excluí-lo, redireciona ao primeiro usuário (Visitante)
    if (usuarios.length > 0) {
      usuarioSelecionadoId = usuarios[0]._id;
      selectUsuario.value = usuarioSelecionadoId;
      mostrarAviso(`Usuário "${usuario.nome}" excluído! Redirecionado para ${usuarios[0].nome}.`);
    } else {
      usuarioSelecionadoId = '';
      mostrarAviso('Usuário excluído!');
    }
    await carregarPostagens();
  } catch (err) {
    mostrarAviso(err.message, true);
  }
}

btnExcluirUsuario.addEventListener('click', () => {
  const idParaExcluir = selectUsuario.value || usuarioSelecionadoId;
  excluirUsuarioPorId(idParaExcluir);
});

if (btnModalExcluir) {
  btnModalExcluir.addEventListener('click', () => {
    const idParaExcluir = selectUsuario.value || usuarioSelecionadoId;
    excluirUsuarioPorId(idParaExcluir);
  });
}

// 9. RESET DO BANCO
document.getElementById('btn-reset').addEventListener('click', async () => {
  if (!confirm('⚠ ATENÇÃO: Isso apagará todas as postagens, comentários e usuários cadastrados (o usuário Visitante será mantido). Confirmar?')) return;
  try {
    const res = await fetch('/api/reset', { method: 'POST' });
    const dados = await res.json();
    if (!res.ok) throw new Error(dados.erro || 'Falha ao resetar');
    usuarioSelecionadoId = '';
    mostrarAviso('Banco de dados resetado! O usuário Visitante fixo foi mantido.');
    await carregarUsuarios();
    if (usuarios.length > 0) {
      usuarioSelecionadoId = usuarios[0]._id;
      selectUsuario.value = usuarioSelecionadoId;
    }
    await carregarPostagens();
  } catch (err) {
    mostrarAviso(err.message, true);
  }
});

// INICIALIZAÇÃO
(async function init() {
  await carregarUsuarios();
  await carregarPostagens();
})();
