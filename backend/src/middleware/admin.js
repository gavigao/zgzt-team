// 权限中间件，必须在 authenticate 之后使用。
function requireAdmin(req, res, next) {
  if (!['owner', 'admin'].includes(req.user?.role)) {
    return res.status(403).json({ code: 403, data: null, message: '需要管理员权限' });
  }
  next();
}

function requireOwner(req, res, next) {
  if (req.user?.role !== 'owner') {
    return res.status(403).json({ code: 403, data: null, message: '只有总负责人可以管理管理员' });
  }
  next();
}

module.exports = { requireAdmin, requireOwner };
