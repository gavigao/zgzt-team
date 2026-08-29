const pool = require('../db/index');

// 辅助：构建分页 SQL 并执行
async function paginatedQuery({ baseTable, joins = '', filters = [], filterValues = [], orderBy, page = 1, limit = 20, selectFields = '*' }) {
  const p = parseInt(page);
  const l = parseInt(limit);
  const offset = (p - 1) * l;

  const whereClause = filters.length > 0 ? 'WHERE ' + filters.join(' AND ') : '';
  const countSql = `SELECT COUNT(*) as total FROM ${baseTable} ${joins} ${whereClause}`;
  const dataSql = `SELECT ${selectFields} FROM ${baseTable} ${joins} ${whereClause} ORDER BY ${orderBy} LIMIT ${l} OFFSET ${offset}`;

  const [countResult] = await pool.query(countSql, filterValues);
  const total = countResult[0].total;

  const [rows] = await pool.query(dataSql, filterValues);

  return { list: rows, total, page: p, limit: l };
}

// ==================== 球队信息 ====================

exports.getTeamInfo = async (req, res, next) => {
  try {
    const { key } = req.params;
    const [rows] = await pool.query('SELECT * FROM team_info WHERE `key` = ?', [key]);
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, data: null, message: '未找到该信息' });
    }
    res.json({ code: 200, data: rows[0], message: 'ok' });
  } catch (err) { next(err); }
};

// ==================== 队员 ====================

exports.getPlayers = async (req, res, next) => {
  try {
    const { status, college, captain, page, limit } = req.query;
    const filters = [];
    const values = [];

    if (status) { filters.push('status = ?'); values.push(status); }
    if (college) { filters.push('college = ?'); values.push(college); }
    if (captain === '1') { filters.push('(is_captain = 1 OR is_former_captain = 1)'); }

    const result = await paginatedQuery({
      baseTable: 'players',
      filters,
      filterValues: values,
      orderBy: 'is_captain DESC, sort_order ASC, grade DESC',
      page, limit,
      selectFields: `id, name, photo_url, position, jersey_number, grade, college, status,
        CASE WHEN bio_visible = 1 THEN bio ELSE NULL END AS bio,
        CASE WHEN workplace_visible = 1 THEN workplace ELSE NULL END AS workplace,
        CASE WHEN city_visible = 1 THEN city ELSE NULL END AS city,
        join_year, message, is_captain, is_former_captain, sort_order, created_at, updated_at`,
    });

    res.json({ code: 200, data: result, message: 'ok' });
  } catch (err) { next(err); }
};

exports.getPlayerById = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, photo_url, position, jersey_number, grade, college, status,
              CASE WHEN bio_visible = 1 THEN bio ELSE NULL END AS bio,
              CASE WHEN workplace_visible = 1 THEN workplace ELSE NULL END AS workplace,
              CASE WHEN city_visible = 1 THEN city ELSE NULL END AS city,
              join_year, message, is_captain, is_former_captain, sort_order, created_at, updated_at
       FROM players WHERE id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, data: null, message: '队员不存在' });
    }
    res.json({ code: 200, data: rows[0], message: 'ok' });
  } catch (err) { next(err); }
};

// ==================== 赛季 ====================

exports.getSeasons = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM seasons ORDER BY name DESC');
    res.json({ code: 200, data: rows, message: 'ok' });
  } catch (err) { next(err); }
};

// ==================== 比赛 ====================

exports.getMatches = async (req, res, next) => {
  try {
    const { season, scope, page, limit } = req.query;
    const filters = [];
    const values = [];
    let orderBy = `
      CASE WHEN m.match_date >= CURDATE() AND (m.our_score IS NULL OR m.opponent_score IS NULL) THEN 0 ELSE 1 END ASC,
      CASE WHEN m.match_date >= CURDATE() AND (m.our_score IS NULL OR m.opponent_score IS NULL) THEN m.match_date END ASC,
      m.match_date DESC
    `;

    if (season) { filters.push('m.season_id = ?'); values.push(season); }
    if (scope === 'upcoming') {
      filters.push('m.match_date >= CURDATE()');
      filters.push('(m.our_score IS NULL OR m.opponent_score IS NULL)');
      orderBy = 'm.match_date ASC';
    } else if (scope === 'completed') {
      filters.push('(m.match_date < CURDATE() OR (m.our_score IS NOT NULL AND m.opponent_score IS NOT NULL))');
      orderBy = 'm.match_date DESC';
    }

    const result = await paginatedQuery({
      baseTable: 'matches m',
      joins: 'LEFT JOIN seasons s ON m.season_id = s.id',
      filters,
      filterValues: values,
      orderBy,
      page, limit,
      selectFields: 'm.*, s.name as season_name',
    });

    res.json({ code: 200, data: result, message: 'ok' });
  } catch (err) { next(err); }
};

exports.getMatchById = async (req, res, next) => {
  try {
    const [matchRows] = await pool.query(
      'SELECT m.*, s.name as season_name FROM matches m LEFT JOIN seasons s ON m.season_id = s.id WHERE m.id = ?',
      [req.params.id]
    );
    if (matchRows.length === 0) {
      return res.status(404).json({ code: 404, data: null, message: '比赛不存在' });
    }

    // 附带评论
    const [commentRows] = await pool.query(
      'SELECT c.*, u.username, u.avatar_url FROM comments c JOIN users u ON c.user_id = u.id WHERE c.match_id = ? ORDER BY c.created_at DESC',
      [req.params.id]
    );

    res.json({
      code: 200,
      data: { ...matchRows[0], comments: commentRows },
      message: 'ok',
    });
  } catch (err) { next(err); }
};

// ==================== 荣誉 ====================

exports.getHonors = async (req, res, next) => {
  try {
    const { type, page, limit } = req.query;
    const filters = [];
    const values = [];

    if (type) { filters.push('type = ?'); values.push(type); }

    const result = await paginatedQuery({
      baseTable: 'honors',
      filters,
      filterValues: values,
      orderBy: 'honor_date DESC, sort_order ASC',
      page, limit,
    });

    res.json({ code: 200, data: result, message: 'ok' });
  } catch (err) { next(err); }
};

// ==================== 新闻 ====================

exports.getNews = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const p = parseInt(page) || 1;
    const l = parseInt(limit) || 10;
    const offset = (p - 1) * l;

    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM news WHERE status = ?', ['published']
    );
    const total = countResult[0].total;

    const [rows] = await pool.query(
      'SELECT id, title, summary, cover_image, is_pinned, published_at FROM news WHERE status = ? ORDER BY is_pinned DESC, published_at DESC LIMIT ? OFFSET ?',
      ['published', l, offset]
    );

    res.json({
      code: 200,
      data: { list: rows, total, page: p, limit: l },
      message: 'ok',
    });
  } catch (err) { next(err); }
};

exports.getNewsById = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM news WHERE id = ? AND status = ?',
      [req.params.id, 'published']
    );
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, data: null, message: '新闻不存在' });
    }
    res.json({ code: 200, data: rows[0], message: 'ok' });
  } catch (err) { next(err); }
};

// ==================== 相册 & 照片 ====================

exports.getAlbums = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*,
              COALESCE(
                (SELECT p.url FROM photos p WHERE p.album_id = a.id ORDER BY p.created_at DESC, p.id DESC LIMIT 1),
                a.cover_photo_url
              ) AS cover_photo_url,
              (SELECT COUNT(*) FROM photos p WHERE p.album_id = a.id) AS photo_count
       FROM photo_albums a
       ORDER BY a.sort_order ASC, a.created_at DESC`
    );
    res.json({ code: 200, data: rows, message: 'ok' });
  } catch (err) { next(err); }
};

exports.getAlbumPhotos = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM photos WHERE album_id = ? ORDER BY sort_order ASC, created_at ASC',
      [req.params.id]
    );
    res.json({ code: 200, data: rows, message: 'ok' });
  } catch (err) { next(err); }
};

// ==================== 首页轮播 ====================

exports.getHomeSlides = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, image_url, alt_text, object_position
       FROM home_slides
       WHERE is_active = 1
       ORDER BY sort_order ASC, id ASC`
    );
    res.json({ code: 200, data: rows, message: 'ok' });
  } catch (err) { next(err); }
};

// ==================== 训练 ====================

exports.getTrainingSchedules = async (req, res, next) => {
  try {
    const { status, upcoming, limit } = req.query;
    let sql = 'SELECT * FROM training_schedules';
    const params = [];
    const filters = [];

    if (status) {
      filters.push('status = ?');
      params.push(status);
    }
    if (upcoming === '1') {
      filters.push('schedule_date >= CURDATE()');
      filters.push("status = 'upcoming'");
    }
    if (filters.length > 0) sql += ` WHERE ${filters.join(' AND ')}`;

    sql += upcoming === '1'
      ? ' ORDER BY schedule_date ASC, start_time ASC'
      : ' ORDER BY schedule_date DESC, start_time DESC';

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 0, 0), 20);
    if (parsedLimit > 0) sql += ` LIMIT ${parsedLimit}`;

    const [rows] = await pool.query(sql, params);
    res.json({ code: 200, data: rows, message: 'ok' });
  } catch (err) { next(err); }
};
