const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/boardController');
const { authenticate, optionalAuth, requireProfile } = require('../middleware/auth');

router.get('/posts', optionalAuth, ctrl.getPosts);
router.post('/posts', authenticate, requireProfile, ctrl.createPost);
router.delete('/posts/:id', authenticate, ctrl.deletePost);
router.post('/posts/:id/like', authenticate, requireProfile, ctrl.togglePostLike);
router.get('/posts/:id/comments', ctrl.getPostComments);
router.post('/posts/:id/comments', authenticate, requireProfile, ctrl.createPostComment);
router.delete('/comments/:id', authenticate, ctrl.deletePostComment);

module.exports = router;
