const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

// POST /api/auth/register — 注册
router.post('/register', authController.register);

// POST /api/auth/login — 登录
router.post('/login', authController.login);

// GET /api/auth/me — 获取当前用户信息（需登录）
router.get('/me', authenticate, authController.getMe);

// PUT /api/auth/me/username — 设置或修改公开用户名（需登录）
router.put('/me/username', authenticate, authController.updateUsername);

// POST /api/auth/me/avatar — 上传或更换社区头像（需登录）
router.post('/me/avatar', authenticate, upload.single('avatar'), authController.updateAvatar);

module.exports = router;
