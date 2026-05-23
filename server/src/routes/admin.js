const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const admin = require('../controllers/adminController');

router.use(auth);
router.use(authorize('super_admin'));

router.get('/stats', admin.getSystemStats);
router.get('/institutions', admin.getInstitutions);
router.get('/users', admin.getUsers);
router.get('/feature-flags', admin.getFeatureFlags);
router.put('/feature-flags/:key', admin.updateFeatureFlag);
router.get('/quotas', admin.getQuotas);
router.put('/quotas/:institutionId', admin.updateQuota);
router.get('/audit-logs', admin.getAuditLogs);

module.exports = router;
