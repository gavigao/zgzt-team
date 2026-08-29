const jwt = require('jsonwebtoken');
const pool = require('../db/index');
const { JWT_SECRET } = require('../config/auth');

async function findCurrentUser(payload) {
  const userId = Number(payload.sub);
  if (!Number.isInteger(userId) || userId <= 0) return null;

  const [rows] = await pool.execute(
    `SELECT u.id, u.role, u.username, u.must_change_password, u.auth_version,
            b.player_id
     FROM users u
     LEFT JOIN user_player_bindings b ON b.user_id = u.id
     WHERE u.id = ?`,
    [userId]
  );
  const user = rows[0] || null;
  if (!user) return null;

  const tokenVersion = Number(payload.ver ?? 0);
  if (tokenVersion !== Number(user.auth_version || 0)) return null;
  return user;
}

// 需要公开互动的接口必须先完成用户名设置，避免绕过首次登录引导。
function requireProfile(req, res, next) {
  if (!req.user?.username?.trim()) {
    return res.status(409).json({
      code: 409,
      data: null,
      message: '请先为账户设置用户名'
    });
  }
  next();
}

// 使用统一初始密码或管理员重置后，只允许先完成密码修改。
function requirePasswordChanged(req, res, next) {
  if (req.user?.must_change_password) {
    return res.status(428).json({
      code: 428,
      data: { must_change_password: true },
      message: '首次登录或密码重置后，请先修改密码',
    });
  }
  next();
}

// 强制认证。角色从数据库实时读取，撤销管理员权限后立即生效。
async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, data: null, message: '请先登录' });
  }

  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    const user = await findCurrentUser(payload);
    if (!user) {
      return res.status(401).json({ code: 401, data: null, message: '用户不存在或已被移除' });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ code: 401, data: null, message: '登录已过期，请重新登录' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ code: 401, data: null, message: '无效的登录凭证' });
    }
    next(err);
  }
}

// 可选认证：无 token 或 token 无效时按访客处理。
async function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next();
  }

  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    const user = await findCurrentUser(payload);
    if (user) req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next();
    }
    next(err);
  }
}

module.exports = { authenticate, optionalAuth, requireProfile, requirePasswordChanged };
