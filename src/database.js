const { MongoClient } = require('mongodb');

const URI = 'mongodb://localhost:27017';
const DB_NAME = 'microblogging';

let client;
let db;

async function conectar() {
  if (db) return db;
  client = new MongoClient(URI);
  await client.connect();
  db = client.db(DB_NAME);
  return db;
}

async function desconectar() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

module.exports = { conectar, desconectar };
