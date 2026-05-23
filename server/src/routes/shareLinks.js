const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const sc = require('../controllers/shareLinkController');

// Public route to resolve links
router.get('/resolve/:slug', sc.resolveShareLink);

// Publicly exposed but session-authenticated student join gateway
router.post('/resolve/:slug/join', auth, sc.joinViaShareLink);

// Faculty & Admin management routes
router.use(auth);
router.use(authorize('faculty', 'institution_owner', 'super_admin'));

router.post('/', sc.createShareLink);
router.get('/', sc.getShareLinks);
router.put('/:slug', sc.updateShareLink);
router.delete('/:slug', sc.deleteShareLink);
router.get('/:slug/analytics', sc.getLinkAnalytics);

module.exports = router;
