const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { aiLimiter } = require('../middleware/rateLimiter');
const { checkQuota } = require('../middleware/quotaMiddleware');
const upload = require('../middleware/upload');
const ai = require('../controllers/aiController');

router.use(auth);
router.use(authorize('faculty', 'institution_owner', 'super_admin'));
router.use(aiLimiter);

router.post('/generate-exam', checkQuota('aiGenerations'), ai.generateExam);
router.post('/chat-exam', checkQuota('aiGenerations'), ai.chatExamGeneration);

router.post('/extract-text', upload.single('file'), ai.extractText);
router.post('/generate-questions', ai.generateQuestions);
router.post('/generate-blueprint', ai.generateBlueprint);
router.post('/copilot', ai.copilotChat);
router.post('/quality-check', ai.checkQuality);
router.post('/generate-rubric', ai.generateRubric);
router.get('/history', ai.getGenerationHistory);
router.get('/conversations', ai.getConversations);

module.exports = router;
