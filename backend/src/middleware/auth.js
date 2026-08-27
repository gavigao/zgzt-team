const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/auth');

// 强制认证 — 未登录返回 401
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, data: null, message: '请先登录' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ code: 401, data: null, message: '登录已过期，请重新登录' });
    }
    return res.status(401).json({ code: 401, data: null, message: '无效的登录凭证' });
  }
}

// 可选认证 — 有 token 就解析，没有也放行
function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.split(' ')[1], JWT_SECRET);
      req.user = { id: payload.sub, role: payload.role };
    } catch {
      // token 无效也放行，req.user 为 undefined
    }
  }
  next();
}

module.exports = { authenticate, optionalAuth };
