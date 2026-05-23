const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const ac = require('../controllers/attemptController');

router.use(auth);

router.post('/start', authorize('student'), ac.startAttempt);
router.put('/:attemptId/save', authorize('student'), ac.saveAnswer);
router.post('/:attemptId/save', ac.saveAnswer);
router.post('/:attemptId/submit', ac.submitAttempt);
router.post('/:attemptId/execute', ac.executeCode);
router.post('/:attemptId/feedback', ac.generateFeedback);
router.get('/mine', authorize('student'), ac.getMyAttempts);
router.get('/:attemptId', ac.getAttempt);
router.get('/exam/:examId', authorize('faculty', 'institution_owner', 'evaluator', 'super_admin'), ac.getExamAttempts);

module.exports = router;
