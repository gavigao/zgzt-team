const pool = require('../db/index');

// 获取某场比赛的评论
exports.getComments = async (req, res, next) => {
  try {
    const userId = req.user?.id || 0;
    const [rows] = await pool.query(
      `SELECT c.id, c.match_id, c.user_id, c.parent_id, c.is_deleted,
              CASE WHEN c.is_deleted = 1 THEN NULL ELSE c.content END AS content,
              CASE WHEN c.is_deleted = 1 THEN 0 ELSE c.like_count END AS like_count,
              c.created_at,
              CASE WHEN c.is_deleted = 1 THEN NULL ELSE u.username END AS username,
              CASE WHEN c.is_deleted = 1 THEN NULL ELSE u.avatar_url END AS avatar_url,
              CASE WHEN c.is_deleted = 1 THEN 0 ELSE EXISTS(
                SELECT 1 FROM comment_likes cl
                WHERE cl.comment_id = c.id AND cl.user_id = ?
              ) END AS liked
       FROM comments c
       JOIN users u ON c.user_id = u.id
       LEFT JOIN comments parent ON parent.id = c.parent_id
       WHERE c.match_id = ?
       ORDER BY COALESCE(parent.created_at, c.created_at) DESC,
                CASE WHEN c.parent_id IS NULL THEN 0 ELSE 1 END ASC,
                c.created_at ASC`,
      [userId, req.params.matchId]
    );
    res.json({ code: 200, data: rows, message: 'ok' });
  } catch (err) { next(err); }
};

// 发表评论（需登录）
exports.createComment = async (req, res, next) => {
  try {
    const { content, parent_id: requestedParentId } = req.body;
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

    let parentId = null;
    if (requestedParentId !== undefined && requestedParentId !== null && requestedParentId !== '') {
      const parsedParentId = Number(requestedParentId);
      if (!Number.isInteger(parsedParentId) || parsedParentId <= 0) {
        return res.status(400).json({ code: 400, data: null, message: '回复对象无效' });
      }

      const [parentRows] = await pool.query(
        'SELECT id, parent_id, is_deleted FROM comments WHERE id = ? AND match_id = ?',
        [parsedParentId, matchId]
      );
      if (parentRows.length === 0) {
        return res.status(404).json({ code: 404, data: null, message: '要回复的评论不存在' });
      }
      if (parentRows[0].is_deleted) {
        return res.status(400).json({ code: 400, data: null, message: '已删除的评论不能直接回复' });
      }
      // 回复子评论时仍归入同一条主评论，页面只展示一级缩进。
      parentId = parentRows[0].parent_id || parentRows[0].id;
    }

    const [result] = await pool.query(
      'INSERT INTO comments (match_id, user_id, parent_id, content) VALUES (?, ?, ?, ?)',
      [matchId, req.user.id, parentId, content.trim()]
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
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query('SELECT * FROM comments WHERE id = ? FOR UPDATE', [req.params.id]);
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ code: 404, data: null, message: '评论不存在' });
    }

    const comment = rows[0];
    // 只能删除自己的评论，管理员可以删任意
    if (comment.user_id !== req.user.id && !['owner', 'admin'].includes(req.user.role)) {
      await connection.rollback();
      return res.status(403).json({ code: 403, data: null, message: '无权删除他人评论' });
    }

    const [[{ childCount }]] = await connection.query(
      'SELECT COUNT(*) AS childCount FROM comments WHERE parent_id = ?',
      [comment.id]
    );

    if (childCount > 0) {
      await connection.query(
        `UPDATE comments
         SET content = '', is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, like_count = 0
         WHERE id = ?`,
        [comment.id]
      );
      await connection.query('DELETE FROM comment_likes WHERE comment_id = ?', [comment.id]);
      await connection.commit();
      return res.json({
        code: 200,
        data: { id: comment.id, soft_deleted: true },
        message: '评论已删除，回复内容已保留',
      });
    }

    await connection.query('DELETE FROM comments WHERE id = ?', [comment.id]);

    // 最后一条回复被删除后，自动清理不再承载回复的删除占位。
    if (comment.parent_id) {
      const [parentRows] = await connection.query(
        `SELECT c.id, c.is_deleted,
                (SELECT COUNT(*) FROM comments child WHERE child.parent_id = c.id) AS child_count
         FROM comments c WHERE c.id = ? FOR UPDATE`,
        [comment.parent_id]
      );
      const parent = parentRows[0];
      if (parent?.is_deleted && Number(parent.child_count) === 0) {
        await connection.query('DELETE FROM comments WHERE id = ?', [parent.id]);
      }
    }

    await connection.commit();
    res.json({ code: 200, data: { id: comment.id, soft_deleted: false }, message: '评论已删除' });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

// 点赞 / 取消点赞（需登录）
exports.toggleLike = async (req, res, next) => {
  try {
    const commentId = req.params.id;
    const [commentRows] = await pool.query('SELECT id, is_deleted FROM comments WHERE id = ?', [commentId]);
    if (commentRows.length === 0) {
      return res.status(404).json({ code: 404, data: null, message: '评论不存在' });
    }
    if (commentRows[0].is_deleted) {
      return res.status(400).json({ code: 400, data: null, message: '已删除的评论不能点赞' });
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
