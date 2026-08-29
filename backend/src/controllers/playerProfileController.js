const pool = require('../db/index');

const EDITABLE_FIELDS = [
  'position',
  'jersey_number',
  'grade',
  'college',
  'status',
  'bio',
  'bio_visible',
  'workplace',
  'workplace_visible',
  'city',
  'city_visible',
  'join_year',
  'message',
];

function nullableText(value, maxLength) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

function nullableYear(value, label) {
  if (value === undefined || value === null || value === '') return null;
  const year = Number(value);
  const currentLimit = new Date().getFullYear() + 1;
  if (!Number.isInteger(year) || year < 1900 || year > currentLimit) {
    const error = new Error(`${label}格式不正确`);
    error.statusCode = 400;
    throw error;
  }
  return year;
}

function nullableNumber(value, label) {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0 || number > 999) {
    const error = new Error(`${label}格式不正确`);
    error.statusCode = 400;
    throw error;
  }
  return number;
}

function normalizeProfile(body) {
  const status = body.status || 'active';
  if (!['active', 'alumni'].includes(status)) {
    const error = new Error('无效的队员状态');
    error.statusCode = 400;
    throw error;
  }

  return {
    position: nullableText(body.position, 50),
    jersey_number: nullableNumber(body.jersey_number, '球衣号码'),
    grade: nullableYear(body.grade, '入学年份'),
    college: nullableText(body.college, 50),
    status,
    bio: nullableText(body.bio, 5000),
    bio_visible: body.bio_visible ? 1 : 0,
    workplace: nullableText(body.workplace, 120),
    workplace_visible: body.workplace_visible ? 1 : 0,
    city: nullableText(body.city, 80),
    city_visible: body.city_visible ? 1 : 0,
    join_year: nullableYear(body.join_year, '入队年份'),
    message: nullableText(body.message, 5000),
  };
}

async function findBoundPlayer(userId) {
  const [rows] = await pool.execute(
    `SELECT p.*
     FROM user_player_bindings b
     JOIN players p ON p.id = b.player_id
     WHERE b.user_id = ?`,
    [userId]
  );
  return rows[0] || null;
}

exports.getMyPlayer = async (req, res, next) => {
  try {
    const player = await findBoundPlayer(req.user.id);
    if (!player) {
      return res.status(404).json({ code: 404, data: null, message: '当前账号尚未绑定队员档案' });
    }
    res.json({ code: 200, data: player, message: 'ok' });
  } catch (err) {
    next(err);
  }
};

exports.updateMyPlayer = async (req, res, next) => {
  try {
    const current = await findBoundPlayer(req.user.id);
    if (!current) {
      return res.status(404).json({ code: 404, data: null, message: '当前账号尚未绑定队员档案' });
    }

    const profile = normalizeProfile(req.body);
    const assignments = EDITABLE_FIELDS.map(field => `${field} = ?`).join(', ');
    await pool.execute(
      `UPDATE players SET ${assignments} WHERE id = ?`,
      [...EDITABLE_FIELDS.map(field => profile[field]), current.id]
    );

    const player = await findBoundPlayer(req.user.id);
    res.json({ code: 200, data: player, message: '队员资料更新成功' });
  } catch (err) {
    next(err);
  }
};

exports.updateMyPlayerPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 400, data: null, message: '请选择队员照片' });
    }
    const current = await findBoundPlayer(req.user.id);
    if (!current) {
      return res.status(404).json({ code: 404, data: null, message: '当前账号尚未绑定队员档案' });
    }

    const photoUrl = `/uploads/${req.file.filename}`;
    await pool.execute('UPDATE players SET photo_url = ? WHERE id = ?', [photoUrl, current.id]);
    const player = await findBoundPlayer(req.user.id);
    res.json({ code: 200, data: player, message: '队员照片更新成功' });
  } catch (err) {
    next(err);
  }
};

exports.normalizeProfile = normalizeProfile;
