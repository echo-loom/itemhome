const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const { initDb } = require('./src/db');
const authRoutes = require('./src/routes/auth');
const familyRoutes = require('./src/routes/family');
const bootstrapRoutes = require('./src/routes/bootstrap');

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: false
}));
app.use(express.json({ limit: '5mb' }));

// 静态资源服务，支持图片访问
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/healthz', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/family', familyRoutes);
app.use('/api', bootstrapRoutes);

const port = Number(process.env.PORT || 3000);

initDb();

app.listen(port, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`shiwuji backend listening on :${port}`);
});

