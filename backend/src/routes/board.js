const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/boardController');
const { authenticate, optionalAuth, requireProfile, requirePasswordChanged } = require('../middleware/auth');

router.get('/posts', optionalAuth, ctrl.getPosts);
router.post('/posts', authenticate, requirePasswordChanged, requireProfile, ctrl.createPost);
router.delete('/posts/:id', authenticate, requirePasswordChanged, ctrl.deletePost);
router.post('/posts/:id/like', authenticate, requirePasswordChanged, requireProfile, ctrl.togglePostLike);
router.get('/posts/:id/comments', ctrl.getPostComments);
router.post('/posts/:id/comments', authenticate, requirePasswordChanged, requireProfile, ctrl.createPostComment);
router.delete('/comments/:id', authenticate, requirePasswordChanged, ctrl.deletePostComment);

module.exports = router;
