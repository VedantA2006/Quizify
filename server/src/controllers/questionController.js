const QuestionBankItem = require('../models/QuestionBankItem');
const QuestionCollection = require('../models/QuestionCollection');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { buildPagination } = require('../utils/helpers');

exports.getQuestions = async (req, res, next) => {
  try {
    const { type, difficulty, bloomLevel, subject, topic, search, source, page = 1, limit = 20 } = req.query;
    const query = { institution: req.user.institution, isActive: true };

    if (type) query.type = type;
    if (difficulty) query.difficulty = difficulty;
    if (bloomLevel) query.bloomLevel = bloomLevel;
    if (subject) query.subject = { $regex: subject, $options: 'i' };
    if (topic) query.topic = { $regex: topic, $options: 'i' };
    if (source) query.source = source;
    if (search) query.$text = { $search: search };

    const total = await QuestionBankItem.countDocuments(query);
    const questions = await QuestionBankItem.find(query)
      .populate('createdBy', 'name')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort('-createdAt');

    ApiResponse.paginated(res, { questions }, buildPagination(total, page, limit));
  } catch (error) { next(error); }
};

exports.getQuestion = async (req, res, next) => {
  try {
    const question = await QuestionBankItem.findOne({
      _id: req.params.id,
      institution: req.user.institution,
    }).populate('createdBy', 'name email');
    if (!question) throw ApiError.notFound('Question not found');
    ApiResponse.success(res, { question });
  } catch (error) { next(error); }
};

exports.createQuestion = async (req, res, next) => {
  try {
    const question = await QuestionBankItem.create({
      ...req.body,
      institution: req.user.institution,
      createdBy: req.user._id,
      source: 'manual',
    });
    ApiResponse.created(res, { question });
  } catch (error) { next(error); }
};

exports.updateQuestion = async (req, res, next) => {
  try {
    const question = await QuestionBankItem.findOne({
      _id: req.params.id,
      institution: req.user.institution,
    });
    if (!question) throw ApiError.notFound('Question not found');

    // Save version history
    question.versions.push({
      text: question.text,
      options: question.options,
      correctAnswer: question.correctAnswer,
      updatedBy: req.user._id,
    });

    Object.assign(question, req.body);
    await question.save();

    ApiResponse.success(res, { question }, 'Question updated');
  } catch (error) { next(error); }
};

exports.deleteQuestion = async (req, res, next) => {
  try {
    await QuestionBankItem.findOneAndUpdate(
      { _id: req.params.id, institution: req.user.institution },
      { isActive: false }
    );
    ApiResponse.success(res, null, 'Question deleted');
  } catch (error) { next(error); }
};

exports.bulkImport = async (req, res, next) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      throw ApiError.badRequest('Questions array is required');
    }

    const docs = questions.map(q => ({
      ...q,
      institution: req.user.institution,
      createdBy: req.user._id,
      source: 'imported',
    }));

    const result = await QuestionBankItem.insertMany(docs, { ordered: false });
    ApiResponse.created(res, { count: result.length, questions: result }, `${result.length} questions imported`);
  } catch (error) { next(error); }
};

// Collections
exports.getCollections = async (req, res, next) => {
  try {
    const collections = await QuestionCollection.find({
      institution: req.user.institution,
      isActive: true,
    })
      .populate('createdBy', 'name')
      .sort('-createdAt');
    ApiResponse.success(res, { collections });
  } catch (error) { next(error); }
};

exports.createCollection = async (req, res, next) => {
  try {
    const collection = await QuestionCollection.create({
      ...req.body,
      institution: req.user.institution,
      createdBy: req.user._id,
    });
    ApiResponse.created(res, { collection });
  } catch (error) { next(error); }
};

exports.updateCollection = async (req, res, next) => {
  try {
    const collection = await QuestionCollection.findOneAndUpdate(
      { _id: req.params.id, institution: req.user.institution },
      req.body,
      { new: true }
    );
    if (!collection) throw ApiError.notFound('Collection not found');
    ApiResponse.success(res, { collection }, 'Collection updated');
  } catch (error) { next(error); }
};

exports.addToCollection = async (req, res, next) => {
  try {
    const { questionIds } = req.body;
    const collection = await QuestionCollection.findOneAndUpdate(
      { _id: req.params.id, institution: req.user.institution },
      { $addToSet: { questions: { $each: questionIds } } },
      { new: true }
    );
    if (!collection) throw ApiError.notFound('Collection not found');
    ApiResponse.success(res, { collection }, 'Questions added to collection');
  } catch (error) { next(error); }
};

exports.deleteCollection = async (req, res, next) => {
  try {
    await QuestionCollection.findOneAndUpdate(
      { _id: req.params.id, institution: req.user.institution },
      { isActive: false }
    );
    ApiResponse.success(res, null, 'Collection deleted');
  } catch (error) { next(error); }
};
