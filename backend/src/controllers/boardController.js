const pool = require('../db/index');

function canModerate(req, authorId) {
  return req.user.id === authorId || ['owner', 'admin'].includes(req.user.role);
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

exports.getPosts = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 30);
    const offset = (page - 1) * limit;
    const userId = req.user?.id || 0;

    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM board_posts');
    const [rows] = await pool.query(
      `SELECT p.*, u.username, u.avatar_url,
        EXISTS(
          SELECT 1 FROM board_post_likes pl
          WHERE pl.post_id = p.id AND pl.user_id = ?
        ) AS liked
       FROM board_posts p
       JOIN users u ON u.id = p.user_id
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    res.json({ code: 200, data: { list: rows, total, page, limit }, message: 'ok' });
  } catch (err) {
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
  try {
    const title = normalizeText(req.body.title);
    const content = normalizeText(req.body.content);

    if (!title || !content) {
      return res.status(400).json({ code: 400, data: null, message: '标题和内容不能为空' });
    }
    if (Array.from(title).length > 120) {
      return res.status(400).json({ code: 400, data: null, message: '标题不能超过 120 个字符' });
    }
    if (Array.from(content).length > 5000) {
      return res.status(400).json({ code: 400, data: null, message: '帖子内容不能超过 5000 个字符' });
    }

    const [result] = await pool.execute(
      'INSERT INTO board_posts (user_id, title, content) VALUES (?, ?, ?)',
      [req.user.id, title, content]
    );
    const [rows] = await pool.execute(
      `SELECT p.*, u.username, u.avatar_url, 0 AS liked
       FROM board_posts p JOIN users u ON u.id = p.user_id
       WHERE p.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ code: 201, data: rows[0], message: '帖子发布成功' });
  } catch (err) {
    next(err);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT user_id FROM board_posts WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, data: null, message: '帖子不存在' });
    }
    if (!canModerate(req, rows[0].user_id)) {
      return res.status(403).json({ code: 403, data: null, message: '无权删除该帖子' });
    }

    await pool.execute('DELETE FROM board_posts WHERE id = ?', [req.params.id]);
    res.json({ code: 200, data: null, message: '帖子已删除' });
  } catch (err) {
    next(err);
  }
};

exports.togglePostLike = async (req, res, next) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [posts] = await connection.execute(
      'SELECT id FROM board_posts WHERE id = ? FOR UPDATE',
      [req.params.id]
    );
    if (posts.length === 0) {
      await connection.rollback();
      return res.status(404).json({ code: 404, data: null, message: '帖子不存在' });
    }

    const [existing] = await connection.execute(
      'SELECT id FROM board_post_likes WHERE post_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    const liked = existing.length === 0;
    if (liked) {
      await connection.execute(
        'INSERT INTO board_post_likes (post_id, user_id) VALUES (?, ?)',
        [req.params.id, req.user.id]
      );
    } else {
      await connection.execute(
        'DELETE FROM board_post_likes WHERE post_id = ? AND user_id = ?',
        [req.params.id, req.user.id]
      );
    }

    const [[{ count }]] = await connection.execute(
      'SELECT COUNT(*) AS count FROM board_post_likes WHERE post_id = ?',
      [req.params.id]
    );
    await connection.execute(
      'UPDATE board_posts SET like_count = ? WHERE id = ?',
      [count, req.params.id]
    );
    await connection.commit();

    res.json({
      code: 200,
      data: { liked, like_count: count },
      message: liked ? '点赞成功' : '已取消点赞',
    });
  } catch (err) {
    if (connection) await connection.rollback();
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

exports.getPostComments = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT c.*, u.username, u.avatar_url
       FROM board_comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.post_id = ?
       ORDER BY c.created_at ASC`,
      [req.params.id]
    );
    res.json({ code: 200, data: rows, message: 'ok' });
  } catch (err) {
    next(err);
  }
};

exports.createPostComment = async (req, res, next) => {
  const content = normalizeText(req.body.content);
  if (!content) {
    return res.status(400).json({ code: 400, data: null, message: '评论内容不能为空' });
  }
  if (Array.from(content).length > 1000) {
    return res.status(400).json({ code: 400, data: null, message: '评论不能超过 1000 个字符' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [posts] = await connection.execute(
      'SELECT id FROM board_posts WHERE id = ? FOR UPDATE',
      [req.params.id]
    );
    if (posts.length === 0) {
      await connection.rollback();
      return res.status(404).json({ code: 404, data: null, message: '帖子不存在' });
    }

    const [result] = await connection.execute(
      'INSERT INTO board_comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [req.params.id, req.user.id, content]
    );
    await connection.execute(
      'UPDATE board_posts SET comment_count = comment_count + 1 WHERE id = ?',
      [req.params.id]
    );
    const [rows] = await connection.execute(
      `SELECT c.*, u.username, u.avatar_url
       FROM board_comments c JOIN users u ON u.id = c.user_id
       WHERE c.id = ?`,
      [result.insertId]
    );
    await connection.commit();

    res.status(201).json({ code: 201, data: rows[0], message: '评论发表成功' });
  } catch (err) {
    if (connection) await connection.rollback();
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

exports.deletePostComment = async (req, res, next) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      'SELECT post_id, user_id FROM board_comments WHERE id = ? FOR UPDATE',
      [req.params.id]
    );
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ code: 404, data: null, message: '评论不存在' });
    }
    if (!canModerate(req, rows[0].user_id)) {
      await connection.rollback();
      return res.status(403).json({ code: 403, data: null, message: '无权删除该评论' });
    }

    await connection.execute('DELETE FROM board_comments WHERE id = ?', [req.params.id]);
    await connection.execute(
      'UPDATE board_posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = ?',
      [rows[0].post_id]
    );
    await connection.commit();

    res.json({ code: 200, data: null, message: '评论已删除' });
  } catch (err) {
    if (connection) await connection.rollback();
    next(err);
  } finally {
    if (connection) connection.release();
  }
};
