const Database = require('better-sqlite3');

const path = require('path');

function genId() {
  // simple uuid v4-ish
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function initDb() {
  const dbPath = process.env.SQLITE_PATH || path.join(__dirname, '..', 'shiwuji.sqlite3');
  const db = new Database(dbPath);

  // Expose globally for simple demo project usage.
  global.__SHIWUJI_DB__ = db;

  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nickname TEXT NOT NULL,
      personal_family_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS families (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS family_members (
      family_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      joined_at TEXT NOT NULL,
      PRIMARY KEY (family_id, user_id),
      FOREIGN KEY (family_id) REFERENCES families(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS user_active_family (
      user_id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (family_id) REFERENCES families(id)
    );

    CREATE TABLE IF NOT EXISTS family_store (
      family_id TEXT PRIMARY KEY,
      items_json TEXT NOT NULL,
      rooms_json TEXT NOT NULL,
      layouts_json TEXT NOT NULL,
      borrow_json TEXT NOT NULL,
      maint_json TEXT NOT NULL,
      service_json TEXT NOT NULL,
      move_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (family_id) REFERENCES families(id)
    );
  `);

  return db;
}

function getDb() {
  if (!global.__SHIWUJI_DB__) throw new Error('DB not initialized');
  return global.__SHIWUJI_DB__;
}

module.exports = { initDb, getDb, genId };

