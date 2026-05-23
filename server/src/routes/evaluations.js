const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const ev = require('../controllers/evaluationController');

router.use(auth);
router.use(authorize('evaluator', 'faculty', 'institution_owner', 'super_admin'));

router.get('/queue', ev.getEvaluationQueue);
router.post('/:attemptId', ev.evaluateAttempt);
router.get('/:attemptId', ev.getEvaluation);
router.post('/publish/:examId', ev.publishResults);

module.exports = router;
