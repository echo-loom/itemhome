const express = require('express');
const { getDb } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function getActiveFamilyId(db, userId) {
  const row = db.prepare('SELECT family_id FROM user_active_family WHERE user_id = ?').get(userId);
  return row ? row.family_id : null;
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

router.get('/bootstrap', authMiddleware, (req, res) => {
  const db = getDb();
  const userId = req.auth.userId;
  const familyId = getActiveFamilyId(db, userId);
  if (!familyId) return res.status(404).json({ error: 'no_active_family' });

  ensureFamilyStoreExists(db, familyId);

  const store = db.prepare('SELECT * FROM family_store WHERE family_id = ?').get(familyId);
  return res.json({
    familyId,
    store: {
      items: JSON.parse(store.items_json),
      rooms: JSON.parse(store.rooms_json),
      layouts: JSON.parse(store.layouts_json),
      borrow: JSON.parse(store.borrow_json),
      maint: JSON.parse(store.maint_json),
      service: JSON.parse(store.service_json),
      move: JSON.parse(store.move_json)
    }
  });
});

router.post('/bootstrap', authMiddleware, (req, res) => {
  const db = getDb();
  const userId = req.auth.userId;
  const familyId = getActiveFamilyId(db, userId);
  if (!familyId) return res.status(404).json({ error: 'no_active_family' });

  const payload = req.body && req.body.store ? req.body.store : {};
  const items = Array.isArray(payload.items) ? payload.items : [];
  const rooms = Array.isArray(payload.rooms) ? payload.rooms : [];
  const layouts = (payload.layouts && typeof payload.layouts === 'object') ? payload.layouts : {};
  const borrow = Array.isArray(payload.borrow) ? payload.borrow : [];
  const maint = (payload.maint && typeof payload.maint === 'object') ? payload.maint : {};
  const service = Array.isArray(payload.service) ? payload.service : [];
  const move = (payload.move && typeof payload.move === 'object') ? payload.move : { packed: {} };

  ensureFamilyStoreExists(db, familyId);

  db.prepare(`
    UPDATE family_store
    SET items_json = ?, rooms_json = ?, layouts_json = ?, borrow_json = ?, maint_json = ?, service_json = ?, move_json = ?, updated_at = ?
    WHERE family_id = ?
  `).run(
    JSON.stringify(items),
    JSON.stringify(rooms),
    JSON.stringify(layouts),
    JSON.stringify(borrow),
    JSON.stringify(maint),
    JSON.stringify(service),
    JSON.stringify(move),
    new Date().toISOString(),
    familyId
  );

  return res.json({ ok: true });
});

module.exports = router;

