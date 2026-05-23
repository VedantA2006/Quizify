const User = require('../models/User');
const Institution = require('../models/Institution');
const Exam = require('../models/Exam');
const QuestionBankItem = require('../models/QuestionBankItem');
const AiGenerationLog = require('../models/AiGenerationLog');
const FeatureFlag = require('../models/FeatureFlag');
const UsageQuotaConfig = require('../models/UsageQuotaConfig');
const AuditTrail = require('../models/AuditTrail');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { buildPagination } = require('../utils/helpers');

exports.getSystemStats = async (req, res, next) => {
  try {
    const [totalUsers, totalInstitutions, totalExams, totalQuestions, totalGenerations] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Institution.countDocuments({ isActive: true }),
      Exam.countDocuments({ isActive: true }),
      QuestionBankItem.countDocuments({ isActive: true }),
      AiGenerationLog.countDocuments(),
    ]);

    const usersByRole = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    ApiResponse.success(res, {
      totalUsers, totalInstitutions, totalExams, totalQuestions, totalGenerations,
      usersByRole,
    });
  } catch (error) { next(error); }
};

exports.getInstitutions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};
    if (search) query.name = { $regex: search, $options: 'i' };

    const total = await Institution.countDocuments(query);
    const institutions = await Institution.find(query)
      .populate('owner', 'name email')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort('-createdAt');

    ApiResponse.paginated(res, { institutions }, buildPagination(total, page, limit));
  } catch (error) { next(error); }
};

exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .populate('institution', 'name')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort('-createdAt');

    ApiResponse.paginated(res, { users }, buildPagination(total, page, limit));
  } catch (error) { next(error); }
};

exports.getFeatureFlags = async (req, res, next) => {
  try {
    const flags = await FeatureFlag.find().sort('key');
    ApiResponse.success(res, { flags });
  } catch (error) { next(error); }
};

exports.updateFeatureFlag = async (req, res, next) => {
  try {
    const flag = await FeatureFlag.findOneAndUpdate(
      { key: req.params.key },
      { ...req.body, key: req.params.key },
      { upsert: true, new: true }
    );
    ApiResponse.success(res, { flag }, 'Feature flag updated');
  } catch (error) { next(error); }
};

exports.getQuotas = async (req, res, next) => {
  try {
    const quotas = await UsageQuotaConfig.find()
      .populate('institution', 'name')
      .sort('-updatedAt');
    ApiResponse.success(res, { quotas });
  } catch (error) { next(error); }
};

exports.updateQuota = async (req, res, next) => {
  try {
    const quota = await UsageQuotaConfig.findOneAndUpdate(
      { institution: req.params.institutionId },
      req.body,
      { upsert: true, new: true }
    );
    ApiResponse.success(res, { quota }, 'Quota updated');
  } catch (error) { next(error); }
};

exports.getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, resource, action } = req.query;
    const query = {};
    if (resource) query.resource = resource;
    if (action) query.action = action;

    const total = await AuditTrail.countDocuments(query);
    const logs = await AuditTrail.find(query)
      .populate('userId', 'name email')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    ApiResponse.paginated(res, { logs }, buildPagination(total, page, limit));
  } catch (error) { next(error); }
};

exports.getSearchResults = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return ApiResponse.success(res, { results: [] });

    const regex = { $regex: q, $options: 'i' };
    const instFilter = req.user.role === 'super_admin' ? {} : { institution: req.user.institution };

    const [exams, questions, users] = await Promise.all([
      Exam.find({ title: regex, isActive: true, ...instFilter }).select('title subject status').limit(10),
      QuestionBankItem.find({ text: regex, isActive: true, ...instFilter }).select('text type subject').limit(10),
      req.user.role === 'super_admin'
        ? User.find({ $or: [{ name: regex }, { email: regex }] }).select('name email role').limit(10)
        : Promise.resolve([]),
    ]);

    ApiResponse.success(res, {
      results: {
        exams: exams.map(e => ({ ...e.toObject(), resultType: 'exam' })),
        questions: questions.map(q => ({ ...q.toObject(), resultType: 'question' })),
        users: users.map(u => ({ ...u.toObject(), resultType: 'user' })),
      },
    });
  } catch (error) { next(error); }
};
