const pool = require('../db/index');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { BCRYPT_ROUNDS } = require('../config/auth');

const ACCOUNT_PATTERN = /^[a-z0-9_-]{4,32}$/;
const HOME_SLIDE_POSITIONS = new Set(['center', 'top', 'bottom']);

function normalizeAccount(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 8) return '密码至少需要 8 个字符';
  if (Buffer.byteLength(password, 'utf8') > 72) return '密码过长，请控制在 72 个字节以内';
  return null;
}

function temporaryPassword() {
  return `Zgzt-${crypto.randomBytes(6).toString('base64url')}`;
}

async function selectPlayerWithBinding(connection, id) {
  const [rows] = await connection.query(
    `SELECT p.*, u.id AS bound_user_id, u.account AS bound_account, u.username AS bound_username
     FROM players p
     LEFT JOIN user_player_bindings b ON b.player_id = p.id
     LEFT JOIN users u ON u.id = b.user_id
     WHERE p.id = ?`,
    [id]
  );
  return rows[0] || null;
}

// ==================== 仪表盘 ====================

exports.getDashboard = async (req, res, next) => {
  try {
    const [[{ playerCount }]] = await pool.query('SELECT COUNT(*) as playerCount FROM players');
    const [[{ matchCount }]] = await pool.query('SELECT COUNT(*) as matchCount FROM matches');
    const [[{ newsCount }]] = await pool.query('SELECT COUNT(*) as newsCount FROM news');
    const [[{ userCount }]] = await pool.query('SELECT COUNT(*) as userCount FROM users');
    const [[{ postCount }]] = await pool.query('SELECT COUNT(*) as postCount FROM board_posts');
    const [[{ albumCount }]] = await pool.query('SELECT COUNT(*) as albumCount FROM photo_albums');
    const [[upcomingRow]] = await pool.query(
      "SELECT COUNT(*) as cnt FROM training_schedules WHERE status='upcoming'"
    );

    res.json({
      code: 200,
      data: { playerCount, matchCount, newsCount, userCount, postCount, albumCount, upcomingTraining: upcomingRow.cnt },
      message: 'ok',
    });
  } catch (err) { next(err); }
};

// ==================== 队员管理 ====================

exports.listPlayers = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, u.id AS bound_user_id, u.account AS bound_account, u.username AS bound_username
       FROM players p
       LEFT JOIN user_player_bindings b ON b.player_id = p.id
       LEFT JOIN users u ON u.id = b.user_id
       ORDER BY p.is_captain DESC, p.sort_order ASC, p.grade DESC`
    );
    res.json({ code: 200, data: rows, message: 'ok' });
  } catch (err) { next(err); }
};

exports.createPlayer = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const {
      name, position, jersey_number, grade, college, status, bio, bio_visible,
      workplace, workplace_visible, city, city_visible, join_year, message,
      is_captain, is_former_captain, photo_url, account: rawAccount,
      initial_password: initialPassword,
    } = req.body;
    if (!name) return res.status(400).json({ code: 400, data: null, message: '姓名不能为空' });

    const account = normalizeAccount(rawAccount);
    if (rawAccount && !ACCOUNT_PATTERN.test(account)) {
      return res.status(400).json({ code: 400, data: null, message: '账号需要 4-32 位，只能使用字母、数字、下划线或短横线' });
    }
    const password = initialPassword || '12345678';
    const passwordError = account ? validatePassword(password) : null;
    if (passwordError) return res.status(400).json({ code: 400, data: null, message: passwordError });

    await connection.beginTransaction();
    const [result] = await connection.query(
      `INSERT INTO players
       (name, position, jersey_number, grade, college, status, bio, bio_visible,
        workplace, workplace_visible, city, city_visible, join_year, message,
        is_captain, is_former_captain, photo_url)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [name.trim(), position || null, jersey_number || null, grade || null, college || null,
        status || 'active', bio || null, bio_visible === false ? 0 : 1,
        workplace || null, workplace_visible ? 1 : 0, city || null, city_visible ? 1 : 0,
        join_year || null, message || null, is_captain ? 1 : 0,
        is_former_captain ? 1 : 0, photo_url || null]
    );

    if (account) {
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const [userResult] = await connection.query(
        `INSERT INTO users (account, username, password_hash, role, must_change_password)
         VALUES (?, ?, ?, 'player', 1)`,
        [account, name.trim(), passwordHash]
      );
      await connection.query(
        'INSERT INTO user_player_bindings (user_id, player_id) VALUES (?, ?)',
        [userResult.insertId, result.insertId]
      );
    }

    await connection.commit();
    const player = await selectPlayerWithBinding(connection, result.insertId);
    res.status(201).json({ code: 201, data: player, message: account ? '队员和登录账号添加成功' : '队员添加成功' });
  } catch (err) {
    await connection.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ code: 409, data: null, message: '账号已存在或队员已绑定其他用户' });
    }
    next(err);
  } finally {
    connection.release();
  }
};

exports.updatePlayer = async (req, res, next) => {
  try {
    const {
      name, position, jersey_number, grade, college, status, bio, bio_visible,
      workplace, workplace_visible, city, city_visible, join_year, message,
      is_captain, is_former_captain, photo_url,
    } = req.body;
    const [result] = await pool.query(
      `UPDATE players SET name=?, position=?, jersey_number=?, grade=?, college=?, status=?,
       bio=?, bio_visible=?, workplace=?, workplace_visible=?, city=?, city_visible=?,
       join_year=?, message=?, is_captain=?, is_former_captain=?, photo_url=? WHERE id=?`,
      [name, position || null, jersey_number || null, grade || null, college || null,
        status || 'active', bio || null, bio_visible === false ? 0 : 1,
        workplace || null, workplace_visible ? 1 : 0, city || null, city_visible ? 1 : 0,
        join_year || null, message || null, is_captain ? 1 : 0,
        is_former_captain ? 1 : 0, photo_url || null, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ code: 404, data: null, message: '队员不存在' });
    const player = await selectPlayerWithBinding(pool, req.params.id);
    res.json({ code: 200, data: player, message: '队员更新成功' });
  } catch (err) { next(err); }
};

exports.deletePlayer = async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM players WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ code: 404, data: null, message: '队员不存在' });
    res.json({ code: 200, data: null, message: '队员已删除' });
  } catch (err) { next(err); }
};

// ==================== 比赛管理 ====================

exports.listMatches = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT m.*, s.name as season_name FROM matches m LEFT JOIN seasons s ON m.season_id = s.id ORDER BY m.match_date DESC'
    );
    res.json({ code: 200, data: rows, message: 'ok' });
  } catch (err) { next(err); }
};

exports.createMatch = async (req, res, next) => {
  try {
    const { season_id, opponent, match_date, our_score, opponent_score, summary, competition, stage } = req.body;
    if (!opponent || !match_date) return res.status(400).json({ code: 400, data: null, message: '对手和日期不能为空' });

    const [result] = await pool.query(
      'INSERT INTO matches (season_id, opponent, match_date, our_score, opponent_score, summary, competition, stage, created_by) VALUES (?,?,?,?,?,?,?,?,?)',
      [season_id || null, opponent, match_date, our_score ?? null, opponent_score ?? null, summary || null, competition || null, stage || null, req.user.id]
    );
    const [rows] = await pool.query('SELECT m.*, s.name as season_name FROM matches m LEFT JOIN seasons s ON m.season_id = s.id WHERE m.id = ?', [result.insertId]);
    res.status(201).json({ code: 201, data: rows[0], message: '比赛添加成功' });
  } catch (err) { next(err); }
};

exports.updateMatch = async (req, res, next) => {
  try {
    const { season_id, opponent, match_date, our_score, opponent_score, summary, competition, stage } = req.body;
    const [result] = await pool.query(
      'UPDATE matches SET season_id=?, opponent=?, match_date=?, our_score=?, opponent_score=?, summary=?, competition=?, stage=? WHERE id=?',
      [season_id || null, opponent, match_date, our_score ?? null, opponent_score ?? null, summary || null, competition || null, stage || null, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ code: 404, data: null, message: '比赛不存在' });
    const [rows] = await pool.query('SELECT m.*, s.name as season_name FROM matches m LEFT JOIN seasons s ON m.season_id = s.id WHERE m.id = ?', [req.params.id]);
    res.json({ code: 200, data: rows[0], message: '比赛更新成功' });
  } catch (err) { next(err); }
};

exports.deleteMatch = async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM matches WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ code: 404, data: null, message: '比赛不存在' });
    res.json({ code: 200, data: null, message: '比赛已删除' });
  } catch (err) { next(err); }
};

// ==================== 新闻管理 ====================

exports.listNews = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM news ORDER BY is_pinned DESC, created_at DESC');
    res.json({ code: 200, data: rows, message: 'ok' });
  } catch (err) { next(err); }
};

exports.createNews = async (req, res, next) => {
  try {
    const { title, content, cover_image, summary, is_pinned, status } = req.body;
    if (!title) return res.status(400).json({ code: 400, data: null, message: '标题不能为空' });
    const published_at = status === 'published' ? new Date() : null;

    const [result] = await pool.query(
      'INSERT INTO news (title, content, cover_image, summary, is_pinned, status, published_at, created_by) VALUES (?,?,?,?,?,?,?,?)',
      [title, content || null, cover_image || null, summary || null, is_pinned ? 1 : 0, status || 'draft', published_at, req.user.id]
    );
    const [rows] = await pool.query('SELECT * FROM news WHERE id = ?', [result.insertId]);
    res.status(201).json({ code: 201, data: rows[0], message: '新闻添加成功' });
  } catch (err) { next(err); }
};

exports.updateNews = async (req, res, next) => {
  try {
    const { title, content, cover_image, summary, is_pinned, status } = req.body;
    // 如果从草稿变为发布，设置发布时间
    const [old] = await pool.query('SELECT status FROM news WHERE id = ?', [req.params.id]);
    const wasDraft = old[0]?.status === 'draft';
    const published_at = (wasDraft && status === 'published') ? new Date() : undefined;

    let sql, params;
    if (published_at) {
      sql = 'UPDATE news SET title=?, content=?, cover_image=?, summary=?, is_pinned=?, status=?, published_at=? WHERE id=?';
      params = [title, content || null, cover_image || null, summary || null, is_pinned ? 1 : 0, status, published_at, req.params.id];
    } else {
      sql = 'UPDATE news SET title=?, content=?, cover_image=?, summary=?, is_pinned=?, status=? WHERE id=?';
      params = [title, content || null, cover_image || null, summary || null, is_pinned ? 1 : 0, status, req.params.id];
    }

    const [result] = await pool.query(sql, params);
    if (result.affectedRows === 0) return res.status(404).json({ code: 404, data: null, message: '新闻不存在' });
    const [rows] = await pool.query('SELECT * FROM news WHERE id = ?', [req.params.id]);
    res.json({ code: 200, data: rows[0], message: '新闻更新成功' });
  } catch (err) { next(err); }
};

exports.deleteNews = async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM news WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ code: 404, data: null, message: '新闻不存在' });
    res.json({ code: 200, data: null, message: '新闻已删除' });
  } catch (err) { next(err); }
};

// ==================== 荣誉管理 ====================

exports.listHonors = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM honors ORDER BY honor_date DESC, sort_order ASC');
    res.json({ code: 200, data: rows, message: 'ok' });
  } catch (err) { next(err); }
};

exports.createHonor = async (req, res, next) => {
  try {
    const { title, description, honor_date, type, recipient, image_url } = req.body;
    if (!title) return res.status(400).json({ code: 400, data: null, message: '荣誉名称不能为空' });
    const [result] = await pool.query(
      'INSERT INTO honors (title, description, honor_date, type, recipient, image_url) VALUES (?,?,?,?,?,?)',
      [title, description || null, honor_date || null, type || 'team', recipient || null, image_url || null]
    );
    const [rows] = await pool.query('SELECT * FROM honors WHERE id = ?', [result.insertId]);
    res.status(201).json({ code: 201, data: rows[0], message: '荣誉添加成功' });
  } catch (err) { next(err); }
};

exports.updateHonor = async (req, res, next) => {
  try {
    const { title, description, honor_date, type, recipient, image_url } = req.body;
    const [result] = await pool.query(
      'UPDATE honors SET title=?, description=?, honor_date=?, type=?, recipient=?, image_url=? WHERE id=?',
      [title, description || null, honor_date || null, type || 'team', recipient || null, image_url || null, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ code: 404, data: null, message: '荣誉不存在' });
    const [rows] = await pool.query('SELECT * FROM honors WHERE id = ?', [req.params.id]);
    res.json({ code: 200, data: rows[0], message: '荣誉更新成功' });
  } catch (err) { next(err); }
};

exports.deleteHonor = async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM honors WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ code: 404, data: null, message: '荣誉不存在' });
    res.json({ code: 200, data: null, message: '荣誉已删除' });
  } catch (err) { next(err); }
};

// ==================== 相册管理 ====================

exports.listAlbums = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM photo_albums ORDER BY sort_order ASC, created_at DESC');
    res.json({ code: 200, data: rows, message: 'ok' });
  } catch (err) { next(err); }
};

exports.createAlbum = async (req, res, next) => {
  try {
    const { title, description, cover_photo_url } = req.body;
    if (!title) return res.status(400).json({ code: 400, data: null, message: '相册名称不能为空' });
    const [result] = await pool.query(
      'INSERT INTO photo_albums (title, description, cover_photo_url, created_by) VALUES (?,?,?,?)',
      [title, description || null, cover_photo_url || null, req.user.id]
    );
    const [rows] = await pool.query('SELECT * FROM photo_albums WHERE id = ?', [result.insertId]);
    res.status(201).json({ code: 201, data: rows[0], message: '相册添加成功' });
  } catch (err) { next(err); }
};

exports.updateAlbum = async (req, res, next) => {
  try {
    const { title, description, cover_photo_url } = req.body;
    const [result] = await pool.query(
      'UPDATE photo_albums SET title=?, description=?, cover_photo_url=? WHERE id=?',
      [title, description || null, cover_photo_url || null, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ code: 404, data: null, message: '相册不存在' });
    const [rows] = await pool.query('SELECT * FROM photo_albums WHERE id = ?', [req.params.id]);
    res.json({ code: 200, data: rows[0], message: '相册更新成功' });
  } catch (err) { next(err); }
};

exports.deleteAlbum = async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM photo_albums WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ code: 404, data: null, message: '相册不存在' });
    res.json({ code: 200, data: null, message: '相册已删除' });
  } catch (err) { next(err); }
};

// ==================== 照片管理 ====================

// 上传照片到指定相册
exports.uploadPhoto = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ code: 400, data: null, message: '请选择图片文件' });

    const url = '/uploads/' + req.file.filename;
    const { caption } = req.body;
    const albumId = req.params.id;

    const [result] = await pool.query(
      'INSERT INTO photos (album_id, url, caption, uploaded_by) VALUES (?,?,?,?)',
      [albumId, url, caption || null, req.user.id]
    );
    const [rows] = await pool.query('SELECT * FROM photos WHERE id = ?', [result.insertId]);
    res.status(201).json({ code: 201, data: rows[0], message: '照片上传成功' });
  } catch (err) { next(err); }
};

exports.deletePhoto = async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM photos WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ code: 404, data: null, message: '照片不存在' });
    res.json({ code: 200, data: null, message: '照片已删除' });
  } catch (err) { next(err); }
};

// 移动照片到其他相册
exports.movePhoto = async (req, res, next) => {
  try {
    const { album_id } = req.body;
    if (!album_id) return res.status(400).json({ code: 400, data: null, message: '请指定目标相册' });
    const [result] = await pool.query('UPDATE photos SET album_id = ? WHERE id = ?', [album_id, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ code: 404, data: null, message: '照片不存在' });
    res.json({ code: 200, data: null, message: '照片已移动' });
  } catch (err) { next(err); }
};

// 通用图片上传（返回 URL，供队员照片等使用）
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ code: 400, data: null, message: '请选择图片文件' });
    const url = '/uploads/' + req.file.filename;
    res.json({ code: 200, data: { url }, message: '上传成功' });
  } catch (err) { next(err); }
};

// ==================== 首页轮播管理 ====================

function normalizeHomeSlide(body) {
  const imageUrl = typeof body.image_url === 'string' ? body.image_url.trim() : '';
  const altText = typeof body.alt_text === 'string' ? body.alt_text.trim() : '';
  const objectPosition = HOME_SLIDE_POSITIONS.has(body.object_position) ? body.object_position : 'center';
  return {
    imageUrl,
    altText,
    objectPosition,
    isActive: body.is_active === false || body.is_active === 0 ? 0 : 1,
  };
}

function validateHomeSlide(slide) {
  if (!slide.imageUrl) return '请上传或选择轮播图片';
  if (!slide.altText) return '请填写图片说明';
  if (slide.altText.length > 120) return '图片说明不能超过 120 个字符';
  return null;
}

exports.listHomeSlides = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM home_slides ORDER BY sort_order ASC, id ASC'
    );
    res.json({ code: 200, data: rows, message: 'ok' });
  } catch (err) { next(err); }
};

exports.createHomeSlide = async (req, res, next) => {
  try {
    const slide = normalizeHomeSlide(req.body);
    const validationError = validateHomeSlide(slide);
    if (validationError) {
      return res.status(400).json({ code: 400, data: null, message: validationError });
    }

    const [[{ nextSortOrder }]] = await pool.query(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 AS nextSortOrder FROM home_slides'
    );
    const [result] = await pool.query(
      `INSERT INTO home_slides
       (image_url, alt_text, object_position, sort_order, is_active, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [slide.imageUrl, slide.altText, slide.objectPosition, nextSortOrder, slide.isActive, req.user.id]
    );
    const [rows] = await pool.query('SELECT * FROM home_slides WHERE id = ?', [result.insertId]);
    res.status(201).json({ code: 201, data: rows[0], message: '轮播图片添加成功' });
  } catch (err) { next(err); }
};

exports.updateHomeSlide = async (req, res, next) => {
  try {
    const slide = normalizeHomeSlide(req.body);
    const validationError = validateHomeSlide(slide);
    if (validationError) {
      return res.status(400).json({ code: 400, data: null, message: validationError });
    }

    const [result] = await pool.query(
      `UPDATE home_slides
       SET image_url = ?, alt_text = ?, object_position = ?, is_active = ?
       WHERE id = ?`,
      [slide.imageUrl, slide.altText, slide.objectPosition, slide.isActive, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 404, data: null, message: '轮播图片不存在' });
    }
    const [rows] = await pool.query('SELECT * FROM home_slides WHERE id = ?', [req.params.id]);
    res.json({ code: 200, data: rows[0], message: '轮播图片更新成功' });
  } catch (err) { next(err); }
};

exports.deleteHomeSlide = async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM home_slides WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 404, data: null, message: '轮播图片不存在' });
    }
    res.json({ code: 200, data: null, message: '轮播图片已删除' });
  } catch (err) { next(err); }
};

exports.reorderHomeSlides = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const orderedIds = Array.isArray(req.body.ordered_ids)
      ? req.body.ordered_ids.map(Number)
      : [];
    if (orderedIds.length === 0 || orderedIds.some(id => !Number.isInteger(id) || id <= 0)) {
      return res.status(400).json({ code: 400, data: null, message: '排序数据无效' });
    }
    if (new Set(orderedIds).size !== orderedIds.length) {
      return res.status(400).json({ code: 400, data: null, message: '排序数据包含重复项目' });
    }

    const [existingRows] = await connection.query('SELECT id FROM home_slides');
    const existingIds = new Set(existingRows.map(row => Number(row.id)));
    if (existingIds.size !== orderedIds.length || orderedIds.some(id => !existingIds.has(id))) {
      return res.status(400).json({ code: 400, data: null, message: '请提交全部轮播图片的完整顺序' });
    }

    await connection.beginTransaction();
    for (let index = 0; index < orderedIds.length; index += 1) {
      await connection.query(
        'UPDATE home_slides SET sort_order = ? WHERE id = ?',
        [index, orderedIds[index]]
      );
    }
    await connection.commit();
    const [rows] = await connection.query('SELECT * FROM home_slides ORDER BY sort_order ASC, id ASC');
    res.json({ code: 200, data: rows, message: '轮播顺序已更新' });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

// ==================== 训练管理 ====================

exports.listTraining = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM training_schedules ORDER BY schedule_date DESC');
    res.json({ code: 200, data: rows, message: 'ok' });
  } catch (err) { next(err); }
};

exports.createTraining = async (req, res, next) => {
  try {
    const { title, description, schedule_date, start_time, end_time, location, status } = req.body;
    if (!title || !schedule_date) return res.status(400).json({ code: 400, data: null, message: '标题和日期不能为空' });
    const [result] = await pool.query(
      'INSERT INTO training_schedules (title, description, schedule_date, start_time, end_time, location, status, created_by) VALUES (?,?,?,?,?,?,?,?)',
      [title, description || null, schedule_date, start_time || null, end_time || null, location || null, status || 'upcoming', req.user.id]
    );
    const [rows] = await pool.query('SELECT * FROM training_schedules WHERE id = ?', [result.insertId]);
    res.status(201).json({ code: 201, data: rows[0], message: '训练添加成功' });
  } catch (err) { next(err); }
};

exports.updateTraining = async (req, res, next) => {
  try {
    const { title, description, schedule_date, start_time, end_time, location, status } = req.body;
    const [result] = await pool.query(
      'UPDATE training_schedules SET title=?, description=?, schedule_date=?, start_time=?, end_time=?, location=?, status=? WHERE id=?',
      [title, description || null, schedule_date, start_time || null, end_time || null, location || null, status || 'upcoming', req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ code: 404, data: null, message: '训练不存在' });
    const [rows] = await pool.query('SELECT * FROM training_schedules WHERE id = ?', [req.params.id]);
    res.json({ code: 200, data: rows[0], message: '训练更新成功' });
  } catch (err) { next(err); }
};

exports.deleteTraining = async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM training_schedules WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ code: 404, data: null, message: '训练不存在' });
    res.json({ code: 200, data: null, message: '训练已删除' });
  } catch (err) { next(err); }
};

// ==================== 用户管理 ====================

exports.listUsers = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.account, u.username, u.email, u.avatar_url, u.role,
              u.must_change_password, u.created_at, p.id AS player_id, p.name AS player_name
       FROM users u
       LEFT JOIN user_player_bindings b ON b.user_id = u.id
       LEFT JOIN players p ON p.id = b.player_id
       ORDER BY u.created_at DESC`
    );
    res.json({ code: 200, data: rows, message: 'ok' });
  } catch (err) { next(err); }
};

exports.createUser = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const account = normalizeAccount(req.body.account);
    const password = req.body.password || '12345678';
    const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
    const playerId = req.body.player_id ? Number(req.body.player_id) : null;
    const playerName = typeof req.body.player_name === 'string' ? req.body.player_name.trim() : '';

    if (!ACCOUNT_PATTERN.test(account)) {
      return res.status(400).json({ code: 400, data: null, message: '账号需要 4-32 位，只能使用字母、数字、下划线或短横线' });
    }
    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ code: 400, data: null, message: passwordError });
    if (playerId && playerName) {
      return res.status(400).json({ code: 400, data: null, message: '不能同时绑定已有队员和创建新队员' });
    }

    await connection.beginTransaction();
    let resolvedPlayerId = playerId;
    let resolvedPlayerName = '';
    if (playerName) {
      const [playerResult] = await connection.query(
        'INSERT INTO players (name, status) VALUES (?, ?)',
        [playerName, 'active']
      );
      resolvedPlayerId = playerResult.insertId;
      resolvedPlayerName = playerName;
    } else if (playerId) {
      const [players] = await connection.query(
        `SELECT p.name, b.user_id
         FROM players p LEFT JOIN user_player_bindings b ON b.player_id = p.id
         WHERE p.id = ?`,
        [playerId]
      );
      if (players.length === 0) {
        await connection.rollback();
        return res.status(404).json({ code: 404, data: null, message: '队员不存在' });
      }
      if (players[0].user_id) {
        await connection.rollback();
        return res.status(409).json({ code: 409, data: null, message: '该队员已绑定其他用户' });
      }
      resolvedPlayerName = players[0].name;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const [userResult] = await connection.query(
      `INSERT INTO users (account, username, password_hash, role, must_change_password)
       VALUES (?, ?, ?, 'player', 1)`,
      [account, username || resolvedPlayerName || null, passwordHash]
    );
    if (resolvedPlayerId) {
      await connection.query(
        'INSERT INTO user_player_bindings (user_id, player_id) VALUES (?, ?)',
        [userResult.insertId, resolvedPlayerId]
      );
    }

    await connection.commit();
    res.status(201).json({ code: 201, data: { id: userResult.insertId }, message: resolvedPlayerId ? '用户和队员档案创建成功' : '用户创建成功' });
  } catch (err) {
    await connection.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ code: 409, data: null, message: '账号已存在或绑定关系冲突' });
    }
    next(err);
  } finally {
    connection.release();
  }
};

exports.bindUserPlayer = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const userId = Number(req.params.id);
    const playerId = req.body.player_id ? Number(req.body.player_id) : null;
    await connection.beginTransaction();
    const [users] = await connection.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      await connection.rollback();
      return res.status(404).json({ code: 404, data: null, message: '用户不存在' });
    }

    await connection.query('DELETE FROM user_player_bindings WHERE user_id = ?', [userId]);
    if (playerId) {
      await connection.query(
        'INSERT INTO user_player_bindings (user_id, player_id) VALUES (?, ?)',
        [userId, playerId]
      );
    }
    await connection.commit();
    res.json({ code: 200, data: null, message: playerId ? '队员绑定成功' : '已解除队员绑定' });
  } catch (err) {
    await connection.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ code: 409, data: null, message: '该队员已绑定其他用户' });
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(404).json({ code: 404, data: null, message: '队员不存在' });
    }
    next(err);
  } finally {
    connection.release();
  }
};

exports.resetUserPassword = async (req, res, next) => {
  try {
    const targetId = Number(req.params.id);
    if (targetId === req.user.id) {
      return res.status(400).json({ code: 400, data: null, message: '请在账户资料中修改自己的密码' });
    }
    const [users] = await pool.query('SELECT id, role FROM users WHERE id = ?', [targetId]);
    if (users.length === 0) {
      return res.status(404).json({ code: 404, data: null, message: '用户不存在' });
    }
    if (users[0].role === 'owner' && req.user.role !== 'owner') {
      return res.status(403).json({ code: 403, data: null, message: '管理员不能重置总负责人的密码' });
    }

    const password = temporaryPassword();
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await pool.query(
      `UPDATE users
       SET password_hash = ?, must_change_password = 1, auth_version = auth_version + 1
       WHERE id = ?`,
      [passwordHash, targetId]
    );
    res.json({ code: 200, data: { temporary_password: password }, message: '临时密码已生成，仅显示本次' });
  } catch (err) { next(err); }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const targetId = Number(req.params.id);
    if (targetId === req.user.id) {
      return res.status(400).json({ code: 400, data: null, message: '不能删除自己的账户' });
    }
    const [users] = await pool.query('SELECT id, role FROM users WHERE id = ?', [targetId]);
    if (users.length === 0) {
      return res.status(404).json({ code: 404, data: null, message: '用户不存在' });
    }
    if (users[0].role === 'owner') {
      return res.status(403).json({ code: 403, data: null, message: '不能删除总负责人账户' });
    }
    if (req.user.role !== 'owner' && users[0].role === 'admin') {
      return res.status(403).json({ code: 403, data: null, message: '管理员不能删除其他管理员' });
    }

    await pool.query('DELETE FROM users WHERE id = ?', [targetId]);
    res.json({ code: 200, data: null, message: '用户已删除，队员档案已保留' });
  } catch (err) { next(err); }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['admin', 'player'].includes(role)) {
      return res.status(400).json({ code: 400, data: null, message: '无效的角色' });
    }
    // 不能修改自己的角色
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ code: 400, data: null, message: '不能修改自己的角色' });
    }
    const [users] = await pool.query('SELECT id, role FROM users WHERE id = ?', [req.params.id]);
    if (users.length === 0) {
      return res.status(404).json({ code: 404, data: null, message: '用户不存在' });
    }
    if (users[0].role === 'owner') {
      return res.status(403).json({ code: 403, data: null, message: '不能修改总负责人的角色' });
    }

    const [result] = await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ code: 404, data: null, message: '用户不存在' });
    res.json({ code: 200, data: null, message: '角色更新成功' });
  } catch (err) { next(err); }
};

// ==================== 球队信息（设置） ====================

exports.updateTeamInfo = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { title, content } = req.body;
    // UPSERT
    await pool.query(
      'INSERT INTO team_info (`key`, title, content) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE title = VALUES(title), content = VALUES(content)',
      [key, title || null, content || null]
    );
    const [rows] = await pool.query('SELECT * FROM team_info WHERE `key` = ?', [key]);
    res.json({ code: 200, data: rows[0], message: '设置更新成功' });
  } catch (err) { next(err); }
};
