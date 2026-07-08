// ============================================================
// src/database/bau.js
// Conexão + schema do banco do baú (ms13_bau.db).
// ============================================================

const path = require('path');
const Database = require('better-sqlite3');
const { CATEGORIAS_PADRAO } = require('../config/settings');

const fs = require('fs');

// Garante que a pasta data/ existe antes de abrir o banco
const DB_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const DB_PATH = path.join(DB_DIR, 'ms13_bau.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function migrar() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS bau_categorias (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      nome  TEXT UNIQUE NOT NULL,
      emoji TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bau_itens (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      categoria_id      INTEGER NOT NULL REFERENCES bau_categorias(id),
      nome              TEXT NOT NULL,
      emoji             TEXT NOT NULL DEFAULT '📦',
      quantidade        INTEGER NOT NULL DEFAULT 0,
      quantidade_minima INTEGER NOT NULL DEFAULT 5,
      criado_em         TEXT NOT NULL,
      atualizado_em     TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bau_movimentacoes (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id     INTEGER NOT NULL REFERENCES bau_itens(id),
      usuario_id  TEXT NOT NULL,
      usuario_tag TEXT NOT NULL,
      tipo        TEXT NOT NULL, -- 'entrada' | 'saida' | 'ajuste_manual'
      quantidade  INTEGER NOT NULL,
      data        TEXT NOT NULL
    );

    -- Guarda o canal/id da mensagem do painel fixo, pra saber o que editar
    -- mesmo depois de reiniciar o bot.
    CREATE TABLE IF NOT EXISTS bau_painel (
      id         INTEGER PRIMARY KEY CHECK (id = 1),
      channel_id TEXT,
      message_id TEXT
    );

    -- Guarda o message_id do painel de registro
    CREATE TABLE IF NOT EXISTS registro_painel (
      id         INTEGER PRIMARY KEY CHECK (id = 1),
      channel_id TEXT,
      message_id TEXT
    );
  `);

  const inserirCategoria = db.prepare(
     'INSERT OR IGNORE INTO bau_categorias (nome, emoji) VALUES (?, ?)'
  );
  const seed = db.transaction((categorias) => {
     for (const cat of categorias) inserirCategoria.run(cat.nome, cat.emoji);
  });
  seed(CATEGORIAS_PADRAO);
}

migrar();

module.exports = db;
