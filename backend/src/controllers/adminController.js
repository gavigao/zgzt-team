const pool = require('../db/index');

// ==================== 仪表盘 ====================

exports.getDashboard = async (req, res, next) => {
  try {
    const [[{ playerCount }]] = await pool.query('SELECT COUNT(*) as playerCount FROM players');
    const [[{ matchCount }]] = await pool.query('SELECT COUNT(*) as matchCount FROM matches');
    const [[{ newsCount }]] = await pool.query('SELECT COUNT(*) as newsCount FROM news');
    const [[{ userCount }]] = await pool.query('SELECT COUNT(*) as userCount FROM users');
    const [[{ commentCount }]] = await pool.query('SELECT COUNT(*) as commentCount FROM comments');
    const [[{ albumCount }]] = await pool.query('SELECT COUNT(*) as albumCount FROM photo_albums');
    const [[upcomingRow]] = await pool.query(
      "SELECT COUNT(*) as cnt FROM training_schedules WHERE status='upcoming'"
    );

    res.json({
      code: 200,
      data: { playerCount, matchCount, newsCount, userCount, commentCount, albumCount, upcomingTraining: upcomingRow.cnt },
      message: 'ok',
    });
  } catch (err) { next(err); }
};

// ==================== 队员管理 ====================

exports.listPlayers = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM players ORDER BY is_captain DESC, sort_order ASC, grade DESC');
    res.json({ code: 200, data: rows, message: 'ok' });
  } catch (err) { next(err); }
};

exports.createPlayer = async (req, res, next) => {
  try {
    const { name, position, jersey_number, grade, college, status, bio, join_year, message, is_captain, is_former_captain, photo_url } = req.body;
    if (!name) return res.status(400).json({ code: 400, data: null, message: '姓名不能为空' });

    const [result] = await pool.query(
      'INSERT INTO players (name, position, jersey_number, grade, college, status, bio, join_year, message, is_captain, is_former_captain, photo_url) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      [name, position || null, jersey_number || null, grade || null, college || null, status || 'active', bio || null, join_year || null, message || null, is_captain ? 1 : 0, is_former_captain ? 1 : 0, photo_url || null]
    );
    const [rows] = await pool.query('SELECT * FROM players WHERE id = ?', [result.insertId]);
    res.status(201).json({ code: 201, data: rows[0], message: '队员添加成功' });
  } catch (err) { next(err); }
};

exports.updatePlayer = async (req, res, next) => {
  try {
    const { name, position, jersey_number, grade, college, status, bio, join_year, message, is_captain, is_former_captain, photo_url } = req.body;
    const [result] = await pool.query(
      'UPDATE players SET name=?, position=?, jersey_number=?, grade=?, college=?, status=?, bio=?, join_year=?, message=?, is_captain=?, is_former_captain=?, photo_url=? WHERE id=?',
      [name, position || null, jersey_number || null, grade || null, college || null, status || 'active', bio || null, join_year || null, message || null, is_captain ? 1 : 0, is_former_captain ? 1 : 0, photo_url || null, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ code: 404, data: null, message: '队员不存在' });
    const [rows] = await pool.query('SELECT * FROM players WHERE id = ?', [req.params.id]);
    res.json({ code: 200, data: rows[0], message: '队员更新成功' });
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
      'SELECT id, account, username, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ code: 200, data: rows, message: 'ok' });
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
