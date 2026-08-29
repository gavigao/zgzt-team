const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/index');
const { JWT_SECRET, JWT_EXPIRY, BCRYPT_ROUNDS } = require('../config/auth');

const ACCOUNT_PATTERN = /^[a-z0-9_-]{4,32}$/;

function normalizeAccount(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function normalizeUsername(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function validateUsername(username) {
  const length = Array.from(username).length;
  if (length < 2 || length > 20) return '用户名需要 2-20 个字符';
  if (/[\u0000-\u001f\u007f]/.test(username)) return '用户名不能包含控制字符';
  return null;
}

function publicUser(user) {
  return {
    id: user.id,
    account: user.account,
    username: user.username,
    email: user.email ?? null,
    avatar_url: user.avatar_url ?? null,
    role: user.role,
    must_change_password: Boolean(user.must_change_password),
    player_id: user.player_id ?? null,
  };
}

async function findUserById(id) {
  const [rows] = await pool.execute(
    `SELECT u.id, u.account, u.username, u.email, u.avatar_url, u.role,
            u.must_change_password, u.auth_version, u.created_at, b.player_id
     FROM users u
     LEFT JOIN user_player_bindings b ON b.user_id = u.id
     WHERE u.id = ?`,
    [id]
  );
  return rows[0] || null;
}

// 生成 JWT。用户名可修改，所以不写入令牌。
function generateToken(user) {
  return jwt.sign(
    { sub: user.id, ver: Number(user.auth_version || 0) },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

// 注册
exports.register = async (req, res, next) => {
  try {
    const account = normalizeAccount(req.body.account);
    const { password } = req.body;

    if (!account || !password) {
      return res.status(400).json({ code: 400, data: null, message: '账号和密码不能为空' });
    }
    if (!ACCOUNT_PATTERN.test(account)) {
      return res.status(400).json({
        code: 400,
        data: null,
        message: '账号需要 4-32 位，只能使用字母、数字、下划线或短横线',
      });
    }
    if (password.length < 8) {
      return res.status(400).json({ code: 400, data: null, message: '密码至少需要 8 个字符' });
    }
    if (Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ code: 400, data: null, message: '密码过长，请控制在 72 个字节以内' });
    }

    const [existing] = await pool.execute('SELECT id FROM users WHERE account = ?', [account]);
    if (existing.length > 0) {
      return res.status(409).json({ code: 409, data: null, message: '该账号已被注册' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const [result] = await pool.execute(
      'INSERT INTO users (account, username, password_hash, role) VALUES (?, NULL, ?, ?)',
      [account, passwordHash, 'player']
    );

    const user = {
      id: result.insertId,
      account,
      username: null,
      email: null,
      avatar_url: null,
      role: 'player',
      must_change_password: 0,
      auth_version: 0,
      player_id: null,
    };
    const token = generateToken(user);

    res.status(201).json({
      code: 201,
      data: { user: publicUser(user), token },
      message: '注册成功',
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ code: 409, data: null, message: '该账号已被注册' });
    }
    next(err);
  }
};

// 登录
exports.login = async (req, res, next) => {
  try {
    // username 回退仅用于兼容尚未刷新的旧前端请求。
    const account = normalizeAccount(req.body.account || req.body.username);
    const { password } = req.body;

    if (!account || !password) {
      return res.status(400).json({ code: 400, data: null, message: '账号和密码不能为空' });
    }

    const [rows] = await pool.execute(
      `SELECT u.id, u.account, u.username, u.email, u.avatar_url, u.password_hash,
              u.role, u.must_change_password, u.auth_version, b.player_id
       FROM users u
       LEFT JOIN user_player_bindings b ON b.user_id = u.id
       WHERE u.account = ?`,
      [account]
    );

    // 统一错误信息，防止用户枚举。
    if (rows.length === 0) {
      return res.status(401).json({ code: 401, data: null, message: '账号或密码错误' });
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ code: 401, data: null, message: '账号或密码错误' });
    }

    const token = generateToken(user);

    res.json({
      code: 200,
      data: { user: publicUser(user), token },
      message: '登录成功',
    });
  } catch (err) {
    next(err);
  }
};

// 获取当前用户信息
exports.getMe = async (req, res, next) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ code: 404, data: null, message: '用户不存在' });
    }
    res.json({ code: 200, data: publicUser(user), message: 'ok' });
  } catch (err) {
    next(err);
  }
};

// 修改密码。首次登录和管理员重置后都必须经过这里解锁账户。
exports.changePassword = async (req, res, next) => {
  try {
    const currentPassword = typeof req.body.current_password === 'string' ? req.body.current_password : '';
    const newPassword = typeof req.body.new_password === 'string' ? req.body.new_password : '';

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ code: 400, data: null, message: '请填写当前密码和新密码' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ code: 400, data: null, message: '新密码至少需要 8 个字符' });
    }
    if (Buffer.byteLength(newPassword, 'utf8') > 72) {
      return res.status(400).json({ code: 400, data: null, message: '新密码过长，请控制在 72 个字节以内' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ code: 400, data: null, message: '新密码不能与当前密码相同' });
    }

    const [rows] = await pool.execute(
      'SELECT password_hash, auth_version FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, data: null, message: '用户不存在' });
    }
    if (!(await bcrypt.compare(currentPassword, rows[0].password_hash))) {
      return res.status(400).json({ code: 400, data: null, message: '当前密码不正确' });
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    const nextVersion = Number(rows[0].auth_version || 0) + 1;
    await pool.execute(
      `UPDATE users
       SET password_hash = ?, must_change_password = 0, auth_version = ?
       WHERE id = ?`,
      [passwordHash, nextVersion, req.user.id]
    );

    const user = await findUserById(req.user.id);
    const token = generateToken(user);
    res.json({
      code: 200,
      data: { user: publicUser(user), token },
      message: '密码修改成功',
    });
  } catch (err) {
    next(err);
  }
};

// 设置或修改公开用户名
exports.updateUsername = async (req, res, next) => {
  try {
    const username = normalizeUsername(req.body.username);
    const validationError = validateUsername(username);
    if (validationError) {
      return res.status(400).json({ code: 400, data: null, message: validationError });
    }

    const [result] = await pool.execute(
      'UPDATE users SET username = ? WHERE id = ?',
      [username, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 404, data: null, message: '用户不存在' });
    }

    const user = await findUserById(req.user.id);
    res.json({ code: 200, data: publicUser(user), message: '用户名更新成功' });
  } catch (err) {
    next(err);
  }
};

// 上传或更换社区头像
exports.updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 400, data: null, message: '请选择头像图片' });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    const [result] = await pool.execute(
      'UPDATE users SET avatar_url = ? WHERE id = ?',
      [avatarUrl, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 404, data: null, message: '用户不存在' });
    }

    const user = await findUserById(req.user.id);
    res.json({ code: 200, data: publicUser(user), message: '头像更新成功' });
  } catch (err) {
    next(err);
  }
};
