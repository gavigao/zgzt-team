const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/commentController');
const { authenticate, optionalAuth, requireProfile, requirePasswordChanged } = require('../middleware/auth');

// 获取评论（公开，带可选登录态用于判断是否已点赞）
router.get('/matches/:matchId', optionalAuth, ctrl.getComments);

// 发表评论（需登录）
router.post('/matches/:matchId', authenticate, requirePasswordChanged, requireProfile, ctrl.createComment);

// 删除评论（需登录，自己或管理员）
router.delete('/:id', authenticate, requirePasswordChanged, ctrl.deleteComment);

// 点赞/取消点赞（需登录）
router.post('/:id/like', authenticate, requirePasswordChanged, requireProfile, ctrl.toggleLike);

module.exports = router;
