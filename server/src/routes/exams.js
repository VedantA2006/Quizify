const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const ec = require('../controllers/examController');

router.get('/code/:code', ec.getExamByCode);

router.use(auth);

router.get('/', authorize('faculty', 'institution_owner', 'super_admin'), ec.getExams);
router.post('/from-ai', authorize('faculty', 'institution_owner', 'super_admin'), ec.createFromAi);
router.post('/save-ai-draft', authorize('faculty', 'institution_owner', 'super_admin'), ec.saveAiDraft);
router.get('/:id', ec.getExam);
router.post('/', authorize('faculty', 'institution_owner', 'super_admin'), ec.createExam);
router.put('/:id', authorize('faculty', 'institution_owner', 'super_admin'), ec.updateExam);
router.delete('/:id', authorize('faculty', 'institution_owner', 'super_admin'), ec.deleteExam);

router.post('/:id/sections', authorize('faculty', 'institution_owner', 'super_admin'), ec.addSection);
router.post('/:id/questions', authorize('faculty', 'institution_owner', 'super_admin'), ec.addQuestionsToSection);
router.post('/:id/publish', authorize('faculty', 'institution_owner', 'super_admin'), ec.publishExam);
router.put('/:id/status', authorize('faculty', 'institution_owner', 'super_admin'), ec.updateExamStatus);
router.get('/:id/health', authorize('faculty', 'institution_owner', 'super_admin'), ec.getExamHealth);

module.exports = router;
