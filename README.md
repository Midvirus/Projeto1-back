# Microblogging

## Temática
Microblogging — inspirado em plataformas de publicação e busca de postagens.

## Integrantes
- [Seu nome aqui]

## Descrição
Aplicação back-end em Node.js com MongoDB para gerenciamento de usuários, postagens e comentários. Permite cadastro, consulta, atualização e exclusão de dados, com validação de campos obrigatórios, tratamento de exceções e registro de logs.

## Entidades / Classes
| Classe | Coleção MongoDB | Campos obrigatórios |
|---|---|---|
| `Usuario` | `usuarios` | nome, email, senha |
| `Postagem` | `postagens` | titulo, conteudo, autorId |
| `Comentario` | `comentarios` | conteudo, autorId, postagemId |

## Funcionalidades
- Cadastro de usuários
- Criação de postagens
- Consulta e busca de postagens por palavra-chave
- Busca de postagens por autor
- Comentários em postagens
- Atualização de usuários, postagens e comentários
- Exclusão de registros
- Validação de campos obrigatórios
- Tratamento de exceções
- Registro de erros em `logs/errors.log`

## Requisitos
- Node.js v18+
- MongoDB v6+ (rodando localmente em `mongodb://localhost:27017`)

## Instalação
```bash
npm install
```

## Configuração do MongoDB
Certifique-se de que o MongoDB está instalado e em execução localmente:
```bash
mongod
```
O banco de dados `microblogging` e as coleções serão criados automaticamente na primeira execução.

## Execução
```bash
npm start
```

## Estrutura do Projeto
```
projeto1/
├── src/
│   ├── index.js        # Ponto de entrada / demonstração das operações
│   ├── database.js     # Conexão com o MongoDB
│   ├── logger.js       # Registro de erros em arquivo de log
│   ├── Usuario.js      # Classe e operações CRUD de usuários
│   ├── Postagem.js     # Classe e operações CRUD de postagens
│   └── Comentario.js   # Classe e operações CRUD de comentários
├── logs/
│   └── errors.log      # Gerado automaticamente em tempo de execução
├── package.json
└── README.md
```
