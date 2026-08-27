const pool = require('../db/index');

// 获取某场比赛的评论
exports.getComments = async (req, res, next) => {
  try {
    const userId = req.user?.id || 0;
    const [rows] = await pool.query(
      'SELECT c.*, u.username, u.avatar_url, EXISTS(SELECT 1 FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = ?) AS liked FROM comments c JOIN users u ON c.user_id = u.id WHERE c.match_id = ? ORDER BY c.created_at DESC',
      [userId, req.params.matchId]
    );
    res.json({ code: 200, data: rows, message: 'ok' });
  } catch (err) { next(err); }
};

// 发表评论（需登录）
exports.createComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    const { matchId } = req.params;

    if (!content || !content.trim()) {
      return res.status(400).json({ code: 400, data: null, message: '评论内容不能为空' });
    }
    if (content.length > 1000) {
      return res.status(400).json({ code: 400, data: null, message: '评论内容不能超过 1000 字' });
    }

    // 检查比赛是否存在
    const [matchRows] = await pool.query('SELECT id FROM matches WHERE id = ?', [matchId]);
    if (matchRows.length === 0) {
      return res.status(404).json({ code: 404, data: null, message: '比赛不存在' });
    }

    const [result] = await pool.query(
      'INSERT INTO comments (match_id, user_id, content) VALUES (?, ?, ?)',
      [matchId, req.user.id, content.trim()]
    );

    // 返回新建的评论（含用户名）
    const [newComment] = await pool.query(
      'SELECT c.*, u.username, u.avatar_url FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?',
      [result.insertId]
    );

    res.status(201).json({ code: 201, data: newComment[0], message: '评论发表成功' });
  } catch (err) { next(err); }
};

// 删除评论（自己或管理员）
exports.deleteComment = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM comments WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, data: null, message: '评论不存在' });
    }

    const comment = rows[0];
    // 只能删除自己的评论，管理员可以删任意
    if (comment.user_id !== req.user.id && !['owner', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ code: 403, data: null, message: '无权删除他人评论' });
    }

    await pool.query('DELETE FROM comments WHERE id = ?', [req.params.id]);
    res.json({ code: 200, data: null, message: '评论已删除' });
  } catch (err) { next(err); }
};

// 点赞 / 取消点赞（需登录）
exports.toggleLike = async (req, res, next) => {
  try {
    const commentId = req.params.id;
    const [commentRows] = await pool.query('SELECT id FROM comments WHERE id = ?', [commentId]);
    if (commentRows.length === 0) {
      return res.status(404).json({ code: 404, data: null, message: '评论不存在' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?',
      [commentId, req.user.id]
    );

    if (existing.length === 0) {
      // 未点赞 → 点赞
      await pool.query('INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)', [commentId, req.user.id]);
      await pool.query('UPDATE comments SET like_count = like_count + 1 WHERE id = ?', [commentId]);
    } else {
      // 已点赞 → 取消
      await pool.query('DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?', [commentId, req.user.id]);
      await pool.query('UPDATE comments SET like_count = like_count - 1 WHERE id = ?', [commentId]);
    }

    const [rows] = await pool.query('SELECT like_count FROM comments WHERE id = ?', [commentId]);
    const liked = existing.length === 0;
    res.json({ code: 200, data: { liked, like_count: rows[0].like_count }, message: liked ? '点赞成功' : '已取消点赞' });
  } catch (err) { next(err); }
};
