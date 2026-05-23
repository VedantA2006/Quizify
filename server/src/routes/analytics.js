const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const an = require('../controllers/analyticsController');

router.use(auth);

router.get('/dashboard', an.getDashboardStats);
router.get('/institution', an.getInstitutionAnalytics);
router.get('/exam/:examId', an.getExamAnalytics);
router.get('/questions/:examId', an.getQuestionAnalytics);

module.exports = router;
