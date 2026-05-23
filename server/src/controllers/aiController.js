const aiService = require('../services/ai/aiService');
const AiGenerationLog = require('../models/AiGenerationLog');
const AiConversation = require('../models/AiConversation');
const Institution = require('../models/Institution');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const fs = require('fs');

exports.extractText = async (req, res, next) => {
  try {
    if (!req.file) throw ApiError.badRequest('No file uploaded');

    const { mimetype, path: filePath } = req.file;
    let text = '';

    if (mimetype === 'application/pdf') {
      const pdfParse = require('pdf-parse');
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (mimetype.startsWith('text/')) {
      text = fs.readFileSync(filePath, 'utf8');
    } else {
      throw ApiError.badRequest('Unsupported file type. Please upload a PDF or text file.');
    }

    // Clean up the uploaded file
    fs.unlink(filePath, () => {});

    ApiResponse.success(res, { text: text.trim().slice(0, 20000) }, 'Text extracted');
  } catch (error) { next(error); }
};


exports.chatExamGeneration = async (req, res, next) => {
  try {
    const { prompt, currentExam } = req.body;
    if (!prompt) throw ApiError.badRequest('Prompt is required');

    const result = await aiService.chatExamGeneration({ prompt, currentExam }, req.user._id, req.user.institution);

    if (!result.success) {
      throw new ApiError(500, 'Generation failed: ' + result.error, result.errors);
    }

    if (result.success) {
      await Institution.findByIdAndUpdate(req.user.institution, { $inc: { 'quotas.aiGenerationsUsed': 1 } });
    }

    ApiResponse.success(res, result.data, 'Exam updated successfully');
  } catch (error) { next(error); }
};

exports.generateExam = async (req, res, next) => {
  try {
    const result = await aiService.generateExam(req.body, req.user._id, req.user.institution);
    if (!result.success) {
      return ApiResponse.error(res, 422, result.error || 'AI generation failed', result.errors);
    }
    if (result.success) {
      await Institution.findByIdAndUpdate(req.user.institution, { $inc: { 'quotas.aiGenerationsUsed': 1 } });
    }

    ApiResponse.success(res, result.data, 'Exam generated successfully');
  } catch (error) { next(error); }
};

exports.generateQuestions = async (req, res, next) => {
  try {
    const result = await aiService.generateQuestions(req.body, req.user._id, req.user.institution);
    if (!result.success) {
      return ApiResponse.error(res, 422, result.error || 'Question generation failed', result.errors);
    }
    ApiResponse.success(res, result.data, 'Questions generated successfully');
  } catch (error) { next(error); }
};

exports.generateBlueprint = async (req, res, next) => {
  try {
    const result = await aiService.generateBlueprint(req.body, req.user._id, req.user.institution);
    if (!result.success) {
      return ApiResponse.error(res, 422, result.error || 'Blueprint generation failed');
    }
    ApiResponse.success(res, result.data, 'Blueprint generated');
  } catch (error) { next(error); }
};

exports.copilotChat = async (req, res, next) => {
  try {
    const { message, conversationId, currentExam } = req.body;

    let conversation;
    if (conversationId) {
      conversation = await AiConversation.findById(conversationId);
    }
    if (!conversation) {
      conversation = await AiConversation.create({
        userId: req.user._id,
        institution: req.user.institution,
        title: message.substring(0, 50),
      });
    }

    conversation.messages.push({ role: 'user', content: message });

    const result = await aiService.copilotChat(
      { message, currentExam },
      req.user._id,
      req.user.institution
    );

    const assistantMessage = result.success
      ? (result.data?.message || JSON.stringify(result.data))
      : 'Sorry, I encountered an error. Please try again.';

    conversation.messages.push({
      role: 'assistant',
      content: assistantMessage,
      metadata: result.data,
    });

    if (result.logId) conversation.generationIds.push(result.logId);
    await conversation.save();

    ApiResponse.success(res, {
      conversation: {
        _id: conversation._id,
        messages: conversation.messages,
      },
      aiResponse: result.data,
    });
  } catch (error) { next(error); }
};

exports.checkQuality = async (req, res, next) => {
  try {
    const result = await aiService.checkQuality(req.body, req.user._id, req.user.institution);
    ApiResponse.success(res, result.data, 'Quality check complete');
  } catch (error) { next(error); }
};

exports.generateRubric = async (req, res, next) => {
  try {
    const result = await aiService.generateRubric(req.body, req.user._id, req.user.institution);
    ApiResponse.success(res, result.data, 'Rubric generated');
  } catch (error) { next(error); }
};

exports.getGenerationHistory = async (req, res, next) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const query = { userId: req.user._id };
    if (type) query.generationType = type;

    const total = await AiGenerationLog.countDocuments(query);
    const logs = await AiGenerationLog.find(query)
      .select('-rawResponse -prompt')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const { buildPagination } = require('../utils/helpers');
    ApiResponse.paginated(res, { logs }, buildPagination(total, page, limit));
  } catch (error) { next(error); }
};

exports.getConversations = async (req, res, next) => {
  try {
    const conversations = await AiConversation.find({
      userId: req.user._id,
      status: 'active',
    }).select('title updatedAt messages').sort('-updatedAt');
    ApiResponse.success(res, { conversations });
  } catch (error) { next(error); }
};
