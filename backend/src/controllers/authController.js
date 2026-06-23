const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/index');
const { JWT_SECRET, JWT_EXPIRY, BCRYPT_ROUNDS } = require('../config/auth');

// 生成 JWT
function generateToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, username: user.username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

// 注册
exports.register = async (req, res, next) => {
  try {
    const { username, password, email } = req.body;

    // 参数校验
    if (!username || !password) {
      return res.status(400).json({ code: 400, data: null, message: '用户名和密码不能为空' });
    }
    if (username.length < 2 || username.length > 20) {
      return res.status(400).json({ code: 400, data: null, message: '用户名需要 2-20 个字符' });
    }
    if (password.length < 6) {
      return res.status(400).json({ code: 400, data: null, message: '密码至少需要 6 个字符' });
    }

    // 检查用户名是否已存在
    const [existing] = await pool.execute('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(409).json({ code: 409, data: null, message: '用户名已被注册' });
    }

    // 创建用户
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [username, email || null, passwordHash, 'player']
    );

    const user = { id: result.insertId, username, role: 'player' };
    const token = generateToken(user);

    res.status(201).json({
      code: 201,
      data: { user, token },
      message: '注册成功',
    });
  } catch (err) {
    next(err);
  }
};

// 登录
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ code: 400, data: null, message: '用户名和密码不能为空' });
    }

    // 查找用户
    const [rows] = await pool.execute(
      'SELECT id, username, password_hash, role FROM users WHERE username = ?',
      [username]
    );

    // 统一错误信息，防止用户枚举
    if (rows.length === 0) {
      return res.status(401).json({ code: 401, data: null, message: '用户名或密码错误' });
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ code: 401, data: null, message: '用户名或密码错误' });
    }

    const token = generateToken(user);

    res.json({
      code: 200,
      data: {
        user: { id: user.id, username: user.username, role: user.role },
        token,
      },
      message: '登录成功',
    });
  } catch (err) {
    next(err);
  }
};

// 获取当前用户信息
exports.getMe = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ code: 404, data: null, message: '用户不存在' });
    }

    res.json({ code: 200, data: rows[0], message: 'ok' });
  } catch (err) {
    next(err);
  }
};
