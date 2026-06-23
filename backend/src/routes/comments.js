const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/commentController');
const { authenticate } = require('../middleware/auth');

// 获取评论（公开）
router.get('/matches/:matchId', ctrl.getComments);

// 发表评论（需登录）
router.post('/matches/:matchId', authenticate, ctrl.createComment);

// 删除评论（需登录，自己或管理员）
router.delete('/:id', authenticate, ctrl.deleteComment);

module.exports = router;
