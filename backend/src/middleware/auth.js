const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  if (!token) return res.status(401).json({ error: 'missing_token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.auth = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid_token' });
  }
}

module.exports = { authMiddleware };

