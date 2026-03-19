const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const token = req.headers?.authorization?.replace('Bearer ', '')
              || req.cookies?.token;

  if (!token) {
    return res.status(401).json({ erro: 'Não autenticado' });
  }
  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

module.exports = authMiddleware;
