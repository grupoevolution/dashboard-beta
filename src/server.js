require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { init } = require('./db/database');
const authRoutes      = require('./routes/auth');
const webhookRoutes   = require('./routes/webhooks');
const dashboardRoutes = require('./routes/dashboard');
const crudRoutes      = require('./routes/crud');

const app  = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('combined'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth/login', rateLimit({ windowMs: 15*60*1000, max: 20 }));
app.use('/api/webhooks',   rateLimit({ windowMs: 60*1000, max: 300 }));

app.use('/css',    express.static(path.join(__dirname, '../public/css')));
app.use('/js',     express.static(path.join(__dirname, '../public/js')));

app.use('/api/auth',     authRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api',           crudRoutes);

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.get('/:slug([a-z0-9]+)', (req, res) => {
  const { db } = require('./db/database');
  const v = db.prepare('SELECT id FROM vendedores WHERE slug=? AND ativo=1').get(req.params.slug);
  if (!v) return res.redirect('/login');
  res.sendFile(path.join(__dirname, '../public/vendedor.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('*', (req, res) => res.redirect('/login'));

init();
app.listen(PORT, () => {
  console.log(`Dashboard rodando na porta ${PORT}`);
});
