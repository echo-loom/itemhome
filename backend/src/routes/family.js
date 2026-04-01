const express = require('express');
const { getDb, genId } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { isJsonObject, isPhone11 } = require('../utils/validation');

const router = express.Router();

function normalizeCode(code) {
  return (code || '').trim().toUpperCase();
}

function getFamilyByCode(db, code) {
  return db.prepare('SELECT * FROM families WHERE code = ?').get(code);
}

function getUserActiveFamilyId(db, userId) {
  const row = db.prepare('SELECT family_id FROM user_active_family WHERE user_id = ?').get(userId);
  return row ? row.family_id : null;
}

function setUserActiveFamily(db, userId, familyId) {
  const now = new Date().toISOString();
  db.prepare('INSERT INTO user_active_family (user_id, family_id, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET family_id=excluded.family_id, updated_at=excluded.updated_at')
    .run(userId, familyId, now);
}

function ensureFamilyStoreExists(db, familyId) {
  const row = db.prepare('SELECT family_id FROM family_store WHERE family_id = ?').get(familyId);
  if (row) return;

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
}

router.get('/me', authMiddleware, (req, res) => {
  const db = getDb();
  const userId = req.auth.userId;
  const familyId = getUserActiveFamilyId(db, userId);
  if (!familyId) return res.status(404).json({ error: 'no_active_family' });
  const family = db.prepare('SELECT id, name, code, created_at FROM families WHERE id = ?').get(familyId);
  return res.json({ family });
});

router.post('/create', authMiddleware, (req, res) => {
  const db = getDb();
  const userId = req.auth.userId;
  const { name } = req.body || {};
  const famName = String(name || '').trim();
  if (!famName) return res.status(400).json({ error: 'invalid_name' });

  const id = genId();
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  const now = new Date().toISOString();

  db.transaction(() => {
    db.prepare('INSERT INTO families (id, name, code, created_at) VALUES (?, ?, ?, ?)').run(id, famName, code, now);
    db.prepare('INSERT INTO family_members (family_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)').run(id, userId, 'owner', now);
    setUserActiveFamily(db, userId, id);
    ensureFamilyStoreExists(db, id);
  })();

  return res.json({ ok: true, family: { id, name: famName, code } });
});

router.post('/join', authMiddleware, (req, res) => {
  const db = getDb();
  const userId = req.auth.userId;
  const { code } = req.body || {};
  const c = normalizeCode(code);
  if (!c) return res.status(400).json({ error: 'invalid_code' });

  const family = getFamilyByCode(db, c);
  if (!family) return res.status(404).json({ error: 'family_not_found' });

  db.transaction(() => {
    db.prepare('INSERT OR IGNORE INTO family_members (family_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)')
      .run(family.id, userId, 'member', new Date().toISOString());
    setUserActiveFamily(db, userId, family.id);
    ensureFamilyStoreExists(db, family.id);
  })();

  return res.json({ ok: true, family: { id: family.id, name: family.name, code: family.code } });
});

router.post('/leave', authMiddleware, (req, res) => {
  const db = getDb();
  const userId = req.auth.userId;
  const user = db.prepare('SELECT personal_family_id FROM users WHERE id = ?').get(userId);
  if (!user || !user.personal_family_id) return res.status(400).json({ error: 'no_personal_family' });

  setUserActiveFamily(db, userId, user.personal_family_id);
  return res.json({ ok: true, familyId: user.personal_family_id });
});

module.exports = router;

