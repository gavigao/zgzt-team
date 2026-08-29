const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/publicController');

// 球队信息
router.get('/team-info/:key', ctrl.getTeamInfo);

// 队员
router.get('/players', ctrl.getPlayers);
router.get('/players/:id', ctrl.getPlayerById);

// 赛季
router.get('/seasons', ctrl.getSeasons);

// 比赛
router.get('/matches', ctrl.getMatches);
router.get('/matches/:id', ctrl.getMatchById);

// 荣誉
router.get('/honors', ctrl.getHonors);

// 新闻
router.get('/news', ctrl.getNews);
router.get('/news/:id', ctrl.getNewsById);

// 相册
router.get('/albums', ctrl.getAlbums);
router.get('/albums/:id/photos', ctrl.getAlbumPhotos);

// 首页轮播
router.get('/home-slides', ctrl.getHomeSlides);

// 训练
router.get('/training', ctrl.getTrainingSchedules);

module.exports = router;
