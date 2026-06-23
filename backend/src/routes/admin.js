const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');
const upload = require('../middleware/upload');

// 所有 admin 路由都需要登录 + 管理员
router.use(authenticate);
router.use(requireAdmin);

// 仪表盘
router.get('/dashboard', ctrl.getDashboard);

// 队员 CRUD
router.get('/players', ctrl.listPlayers);
router.post('/players', ctrl.createPlayer);
router.put('/players/:id', ctrl.updatePlayer);
router.delete('/players/:id', ctrl.deletePlayer);

// 比赛 CRUD
router.get('/matches', ctrl.listMatches);
router.post('/matches', ctrl.createMatch);
router.put('/matches/:id', ctrl.updateMatch);
router.delete('/matches/:id', ctrl.deleteMatch);

// 新闻 CRUD
router.get('/news', ctrl.listNews);
router.post('/news', ctrl.createNews);
router.put('/news/:id', ctrl.updateNews);
router.delete('/news/:id', ctrl.deleteNews);

// 荣誉 CRUD
router.get('/honors', ctrl.listHonors);
router.post('/honors', ctrl.createHonor);
router.put('/honors/:id', ctrl.updateHonor);
router.delete('/honors/:id', ctrl.deleteHonor);

// 相册 CRUD
router.get('/albums', ctrl.listAlbums);
router.post('/albums', ctrl.createAlbum);
router.put('/albums/:id', ctrl.updateAlbum);
router.delete('/albums/:id', ctrl.deleteAlbum);

// 照片（上传 & 删除）
router.post('/albums/:id/photos', upload.single('image'), ctrl.uploadPhoto);
router.delete('/photos/:id', ctrl.deletePhoto);

// 训练 CRUD
router.get('/training', ctrl.listTraining);
router.post('/training', ctrl.createTraining);
router.put('/training/:id', ctrl.updateTraining);
router.delete('/training/:id', ctrl.deleteTraining);

// 用户管理
router.get('/users', ctrl.listUsers);
router.put('/users/:id/role', ctrl.updateUserRole);

// 球队设置
router.put('/team-info/:key', ctrl.updateTeamInfo);

module.exports = router;
