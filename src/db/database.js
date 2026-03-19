const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './data/dashboard.db';
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha_hash TEXT NOT NULL,
      ativo INTEGER DEFAULT 1,
      criado_em TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS vendedores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      email TEXT,
      pin TEXT,
      ativo INTEGER DEFAULT 1,
      criado_em TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome_completo TEXT NOT NULL,
      nome_dash TEXT NOT NULL,
      categoria TEXT DEFAULT 'Curso',
      codigo_kiwify TEXT,
      codigo_ticto TEXT,
      codigo_lastlink TEXT,
      ativo INTEGER DEFAULT 1,
      criado_em TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS vendas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plataforma TEXT NOT NULL,
      evento TEXT NOT NULL,
      produto_id INTEGER REFERENCES produtos(id),
      produto_codigo_externo TEXT,
      produto_nome_externo TEXT,
      valor_bruto REAL DEFAULT 0,
      valor_liquido REAL DEFAULT 0,
      metodo_pagamento TEXT,
      status TEXT DEFAULT 'aprovado',
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      utm_content TEXT,
      utm_term TEXT,
      src TEXT,
      cliente_nome TEXT,
      cliente_email TEXT,
      cliente_doc TEXT,
      payload_raw TEXT,
      criado_em TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS registros_vendedor (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendedor_id INTEGER NOT NULL REFERENCES vendedores(id),
      produto_id INTEGER REFERENCES produtos(id),
      data_registro TEXT NOT NULL,
      canal TEXT,
      qtd_leads INTEGER DEFAULT 0,
      qtd_conversoes INTEGER DEFAULT 0,
      valor_total REAL DEFAULT 0,
      status TEXT DEFAULT 'concluido',
      observacao TEXT,
      criado_em TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS gastos_ads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fonte TEXT NOT NULL,
      data_gasto TEXT NOT NULL,
      valor REAL NOT NULL,
      campanha TEXT,
      criado_em TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_vendas_plataforma ON vendas(plataforma);
    CREATE INDEX IF NOT EXISTS idx_vendas_criado_em  ON vendas(criado_em);
    CREATE INDEX IF NOT EXISTS idx_vendas_produto    ON vendas(produto_id);
    CREATE INDEX IF NOT EXISTS idx_vendas_status     ON vendas(status);
    CREATE INDEX IF NOT EXISTS idx_reg_vendedor      ON registros_vendedor(vendedor_id);
    CREATE INDEX IF NOT EXISTS idx_reg_data          ON registros_vendedor(data_registro);
  `);

  // Migracao: adiciona coluna pin se nao existir (banco ja existente)
  try {
    db.exec(`ALTER TABLE vendedores ADD COLUMN pin TEXT`);
  } catch {}

  // Seed: admin padrao
  const adminCount = db.prepare('SELECT COUNT(*) as c FROM admins').get();
  if (adminCount.c === 0) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare(`INSERT INTO admins (nome, email, senha_hash) VALUES (?, ?, ?)`)
      .run('Administrador', 'admin@dashboard.com', hash);
    console.log('Admin criado: admin@dashboard.com / admin123 — TROQUE A SENHA!');
  }

  // Seed: vendedores
  const vCount = db.prepare('SELECT COUNT(*) as c FROM vendedores').get();
  if (vCount.c === 0) {
    const ins = db.prepare('INSERT INTO vendedores (nome, slug, email, pin) VALUES (?, ?, ?, ?)');
    ins.run('Lucas Moreira', 'lucasmoreira', 'lucas@equipe.com', '1234');
    ins.run('Ana Carolina',  'anacarolina',  'ana@equipe.com',   '1234');
    ins.run('Pedro Viana',   'pedroviana',   'pedro@equipe.com', '1234');
    console.log('Vendedores criados com PIN padrão: 1234');
  }

  // Seed: produtos
  const pCount = db.prepare('SELECT COUNT(*) as c FROM produtos').get();
  if (pCount.c === 0) {
    const ins = db.prepare('INSERT INTO produtos (nome_completo, nome_dash, categoria, codigo_kiwify, codigo_ticto, codigo_lastlink) VALUES (?,?,?,?,?,?)');
    ins.run('TikTok Shop IA — Curso Completo',    'TT SHOP IA',      'Curso',      'prod_ttshop01', '11204', 'LL-44201');
    ins.run('Ascensão — Programa Completo',        'ASCENSÃO',         'Mentoria',   'prod_asc002',   '11310', 'LL-44310');
    ins.run('Comunidade Influencers IA',            'COMUNIDADE IA',   'Assinatura', 'prod_comia03',  '11498', 'LL-44498');
    ins.run('Acesso Vitalício — Todos os Cursos',   'Acesso Vitalício','Vitalício',  'prod_vit004',   '11602', 'LL-44602');
  }

  console.log('Banco inicializado.');
}

module.exports = { db, init };
