const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const ExamShareLink = require('../models/ExamShareLink');
const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const StudentExamAccess = require('../models/StudentExamAccess');
const AccessLog = require('../models/AccessLog');

function sanitizeExamForStudent(exam) {
  const sanitized = typeof exam.toObject === 'function' ? exam.toObject() : { ...exam };
  sanitized.sections?.forEach(section => {
    section.questions?.forEach(sq => {
      if (sq.question) {
        delete sq.question.correctAnswer;
        delete sq.question.explanation;
        delete sq.question.modelAnswer;
        delete sq.question.rubric;
        if (sq.question.options) {
          sq.question.options.forEach(opt => { delete opt.isCorrect; });
        }
        if (sq.question.testCases) {
          sq.question.testCases = sq.question.testCases.filter(tc => !tc.isHidden);
        }
      }
    });
  });
  return sanitized;
}

exports.createShareLink = async (req, res, next) => {
  try {
    const { examId, label, type, password, maxUses, expiresAt, allowedEmails, utmSource } = req.body;

    const exam = await Exam.findOne({ _id: examId, institution: req.user.institution });
    if (!exam) throw ApiError.notFound('Exam not found or does not belong to your institution');

    const slug = crypto.randomBytes(4).toString('hex'); // 8-character unique alphanumeric slug

    let hashedPassword = null;
    if (type === 'password' && password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const shareLink = await ExamShareLink.create({
      exam: examId,
      institution: req.user.institution,
      createdBy: req.user._id,
      slug,
      type: type || 'open',
      password: hashedPassword,
      label: label || 'Main Link',
      maxUses: maxUses === undefined ? null : maxUses,
      expiresAt: expiresAt || null,
      allowedEmails: allowedEmails || [],
      utmSource: utmSource || null
    });

    const fullUrl = `${env.CLIENT_URL}/e/${slug}`;
    ApiResponse.created(res, { shareLink, fullUrl }, 'Share link generated successfully');
  } catch (error) { next(error); }
};

exports.getShareLinks = async (req, res, next) => {
  try {
    const { examId } = req.query;
    if (!examId) throw ApiError.badRequest('ExamId is required');

    const exam = await Exam.findOne({ _id: examId, institution: req.user.institution });
    if (!exam) throw ApiError.notFound('Exam not found');

    const links = await ExamShareLink.find({ exam: examId, isActive: true })
      .select('-password')
      .sort('-createdAt');

    ApiResponse.success(res, { links });
  } catch (error) { next(error); }
};

exports.updateShareLink = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { label, maxUses, expiresAt, isActive, allowedEmails } = req.body;

    const link = await ExamShareLink.findOne({ slug });
    if (!link) throw ApiError.notFound('Share link not found');

    // Verify ownership via exam
    const exam = await Exam.findOne({ _id: link.exam, institution: req.user.institution });
    if (!exam) throw ApiError.forbidden('You do not have access to update this link');

    if (label !== undefined) link.label = label;
    if (maxUses !== undefined) link.maxUses = maxUses;
    if (expiresAt !== undefined) link.expiresAt = expiresAt;
    if (isActive !== undefined) link.isActive = isActive;
    if (allowedEmails !== undefined) link.allowedEmails = allowedEmails;

    await link.save();
    ApiResponse.success(res, { shareLink: link }, 'Share link updated successfully');
  } catch (error) { next(error); }
};

exports.deleteShareLink = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const link = await ExamShareLink.findOne({ slug });
    if (!link) throw ApiError.notFound('Share link not found');

    const exam = await Exam.findOne({ _id: link.exam, institution: req.user.institution });
    if (!exam) throw ApiError.forbidden('You do not have access to delete this link');

    link.isActive = false;
    await link.save();

    ApiResponse.success(res, null, 'Share link deactivated successfully');
  } catch (error) { next(error); }
};

exports.resolveShareLink = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const link = await ExamShareLink.findOne({ slug })
      .populate({
        path: 'exam',
        select: 'title description subject settings.duration settings.scheduledStart settings.scheduledEnd settings.instructions accessCode status'
      })
      .populate('institution', 'name');

    if (!link) throw ApiError.notFound('Share link not found');
    if (!link.isActive) {
      return res.status(410).json({ success: false, message: 'This link has been deactivated' });
    }
    if (link.expiresAt && link.expiresAt < new Date()) {
      return res.status(410).json({ success: false, message: 'This link has expired' });
    }
    if (link.maxUses && link.usedCount >= link.maxUses) {
      return res.status(410).json({ success: false, message: 'This link has reached its maximum uses' });
    }

    if (!link.exam || link.exam.status !== 'published') {
      throw ApiError.notFound('Exam not available');
    }

    ApiResponse.success(res, { link });
  } catch (error) { next(error); }
};

exports.joinViaShareLink = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { password } = req.body;

    const link = await ExamShareLink.findOne({ slug }).populate('exam');
    if (!link) throw ApiError.notFound('Share link not found');
    if (!link.isActive) {
      return res.status(410).json({ success: false, message: 'This link has been deactivated' });
    }
    if (link.expiresAt && link.expiresAt < new Date()) {
      return res.status(410).json({ success: false, message: 'This link has expired' });
    }
    if (link.maxUses && link.usedCount >= link.maxUses) {
      return res.status(410).json({ success: false, message: 'This link has reached its maximum uses' });
    }

    const exam = link.exam;
    if (!exam || exam.status !== 'published') {
      throw ApiError.notFound('Exam not available');
    }

    // invite_only check
    if (link.type === 'invite_only') {
      const emailMatch = link.allowedEmails.some(email => email.toLowerCase() === req.user.email.toLowerCase());
      if (!emailMatch) {
        throw ApiError.forbidden('You are not on the invite list for this exam');
      }
    }

    // password check
    if (link.type === 'password') {
      if (!password) throw ApiError.badRequest('Password is required to join this exam');
      const isMatch = await bcrypt.compare(password, link.password);
      if (!isMatch) throw ApiError.forbidden('Invalid link password');
    }

    // Check if student already in joined list
    const alreadyJoined = link.joinedStudents.some(j => j.student?.toString() === req.user._id.toString());
    if (!alreadyJoined) {
      link.joinedStudents.push({ student: req.user._id, ip: req.ip, joinedAt: new Date() });
      link.usedCount += 1;
      await link.save();
    }

    // Standard startAttempt logic
    const examId = exam._id;
    const now = new Date();
    if (exam.settings?.scheduledStart && now < exam.settings.scheduledStart) {
      throw ApiError.badRequest('Exam has not started yet');
    }
    if (exam.settings?.scheduledEnd && now > exam.settings.scheduledEnd) {
      throw ApiError.badRequest('Exam has ended');
    }

    // Check existing attempt
    const existingAttempt = await ExamAttempt.findOne({
      exam: examId,
      student: req.user._id,
      status: 'in_progress',
    });

    if (existingAttempt) {
      const populatedExam = await Exam.findById(examId).populate('sections.questions.question');
      return ApiResponse.success(res, { attempt: existingAttempt, exam: sanitizeExamForStudent(populatedExam) }, 'Resuming attempt');
    }

    // Check max attempts
    const attemptCount = await ExamAttempt.countDocuments({ exam: examId, student: req.user._id });
    if (exam.settings?.maxAttempts && attemptCount >= exam.settings.maxAttempts) {
      throw ApiError.badRequest('Maximum attempts reached');
    }

    // Create access record
    await StudentExamAccess.findOneAndUpdate(
      { exam: examId, student: req.user._id },
      { accessGranted: true, accessMethod: 'link' },
      { upsert: true }
    );

    // Create attempt
    const attempt = await ExamAttempt.create({
      exam: examId,
      student: req.user._id,
      ip: req.ip,
    });

    // Log access
    await AccessLog.create({
      userId: req.user._id,
      exam: examId,
      action: 'exam_started',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Populate question list for ExamPlayer
    const fullExam = await Exam.findById(examId).populate('sections.questions.question');

    ApiResponse.created(res, { attempt, exam: sanitizeExamForStudent(fullExam) }, 'Exam started');
  } catch (error) { next(error); }
};

exports.getLinkAnalytics = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const link = await ExamShareLink.findOne({ slug });
    if (!link) throw ApiError.notFound('Share link not found');

    const exam = await Exam.findOne({ _id: link.exam, institution: req.user.institution });
    if (!exam) throw ApiError.forbidden('You do not have access to this link');

    // Generate basic analytics
    const totalUses = link.usedCount;
    const uniqueStudents = link.joinedStudents.length;

    // Group by date (last 30 days)
    const usesByDate = [];
    const dateMap = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split('T')[0];
      dateMap[str] = 0;
    }

    link.joinedStudents.forEach(j => {
      const str = j.joinedAt.toISOString().split('T')[0];
      if (dateMap[str] !== undefined) {
        dateMap[str] += 1;
      }
    });

    Object.keys(dateMap).sort().forEach(date => {
      usesByDate.push({ date, count: dateMap[date] });
    });

    const topReferrers = [
      { utmSource: link.utmSource || 'direct', count: totalUses }
    ];

    ApiResponse.success(res, {
      totalUses,
      uniqueStudents,
      usesByDate,
      topReferrers,
      conversionRate: 1.0 // Simple mockup rate
    });
  } catch (error) { next(error); }
};
