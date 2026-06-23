// 管理员权限中间件 — 必须在 authenticate 之后使用
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ code: 403, data: null, message: '需要管理员权限' });
  }
  next();
}

module.exports = requireAdmin;
