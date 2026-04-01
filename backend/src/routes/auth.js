const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { getDb, genId } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { isPasswordOk } = require('../utils/validation');

const router = express.Router();

function getUserByUsername(db, username) {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  return stmt.get(username);
}

function getOrCreateStoreForFamily(db, familyId) {
  const row = db.prepare('SELECT * FROM family_store WHERE family_id = ?').get(familyId);
  if (row) return row;

  const emptyStore = {
    items: [],
    rooms: ['客厅', '卧室', '厨房', '阳台'],
    layouts: {},
    borrow: [],
    maint: {},
    service: [],
    move: { packed: {} }
  };

  db.prepare(`
    INSERT INTO family_store (family_id, items_json, rooms_json, layouts_json, borrow_json, maint_json, service_json, move_json, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    familyId,
    JSON.stringify(emptyStore.items),
    JSON.stringify(emptyStore.rooms),
    JSON.stringify(emptyStore.layouts),
    JSON.stringify(emptyStore.borrow),
    JSON.stringify(emptyStore.maint),
    JSON.stringify(emptyStore.service),
    JSON.stringify(emptyStore.move),
    new Date().toISOString()
  );

  return db.prepare('SELECT * FROM family_store WHERE family_id = ?').get(familyId);
}

router.post('/register', (req, res) => {
  const db = getDb();
  const { username, password, nickname } = req.body || {};
  const uname = (username || '').trim();

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(uname)) return res.status(400).json({ error: 'invalid_username' });
  if (!isPasswordOk(password)) return res.status(400).json({ error: 'invalid_password' });

  const exists = getUserByUsername(db, uname);
  if (exists) return res.status(409).json({ error: 'username_exists' });

  const userId = genId();
  const familyId = genId();
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();

  const passwordHash = bcrypt.hashSync(password, 10);
  const nick = (nickname && String(nickname).trim()) ? String(nickname).trim() : `用户${uname}`;
  const now = new Date().toISOString();

  db.transaction(() => {
    db.prepare(`
      INSERT INTO users (id, username, password_hash, nickname, personal_family_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, uname, passwordHash, nick, familyId, now);

    db.prepare(`
      INSERT INTO families (id, name, code, created_at)
      VALUES (?, ?, ?, ?)
    `).run(familyId, '我的家庭', code, now);

    db.prepare(`
      INSERT INTO family_members (family_id, user_id, role, joined_at)
      VALUES (?, ?, 'owner', ?)
    `).run(familyId, userId, now);

    db.prepare(`
      INSERT INTO user_active_family (user_id, family_id, updated_at)
      VALUES (?, ?, ?)
    `).run(userId, familyId, now);

    getOrCreateStoreForFamily(db, familyId);
  })();

  return res.json({ ok: true, familyCode: code });
});

router.post('/login', (req, res) => {
  const db = getDb();
  const { username, password } = req.body || {};
  const uname = (username || '').trim();

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(uname)) return res.status(400).json({ error: 'invalid_username' });
  if (typeof password !== 'string' || !password) return res.status(400).json({ error: 'invalid_password' });

  const user = getUserByUsername(db, uname);
  if (!user) return res.status(401).json({ error: 'invalid_credentials' });

  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
  return res.json({
    token,
    user: { id: user.id, username: user.username, nickname: user.nickname }
  });
});

router.get('/me', authMiddleware, (req, res) => {
  const db = getDb();
  const userId = req.auth.userId;
  const user = db.prepare('SELECT id, username, nickname FROM users WHERE id = ?').get(userId);
  return res.json({ user });
});

module.exports = router;

