const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/playerProfileController');
const { authenticate, requirePasswordChanged } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticate);
router.use(requirePasswordChanged);

router.get('/me', ctrl.getMyPlayer);
router.put('/me', ctrl.updateMyPlayer);
router.post('/me/photo', upload.single('photo'), ctrl.updateMyPlayerPhoto);

module.exports = router;
