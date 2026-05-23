const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const upload = require('../middleware/upload');
const rc = require('../controllers/resourceController');

router.use(auth);
router.use(authorize('faculty', 'institution_owner', 'super_admin'));

router.get('/', rc.getResources);
router.get('/:id', rc.getResource);
router.post('/', upload.single('file'), rc.uploadResource);
router.put('/:id', rc.updateResource);
router.delete('/:id', rc.deleteResource);
router.get('/:id/download', rc.downloadResource);

module.exports = router;
