const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const qc = require('../controllers/questionController');

router.use(auth);
router.use(authorize('faculty', 'institution_owner', 'super_admin'));

router.get('/', qc.getQuestions);
router.get('/:id', qc.getQuestion);
router.post('/', qc.createQuestion);
router.put('/:id', qc.updateQuestion);
router.delete('/:id', qc.deleteQuestion);
router.post('/bulk-import', qc.bulkImport);

// Collections
router.get('/collections/list', qc.getCollections);
router.post('/collections', qc.createCollection);
router.put('/collections/:id', qc.updateCollection);
router.post('/collections/:id/add', qc.addToCollection);
router.delete('/collections/:id', qc.deleteCollection);

module.exports = router;
