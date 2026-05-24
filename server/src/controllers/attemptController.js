const ExamAttempt = require('../models/ExamAttempt');
const Exam = require('../models/Exam');
const StudentExamAccess = require('../models/StudentExamAccess');
const AccessLog = require('../models/AccessLog');
const QuestionBankItem = require('../models/QuestionBankItem');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const aiService = require('../services/ai/aiService');
const { scheduleJob } = require('../jobs/queue');

exports.startAttempt = async (req, res, next) => {
  try {
    const { examId, accessCode } = req.body;

    const exam = await Exam.findOne({
      _id: examId,
      status: 'published',
      isActive: true,
    }).populate('sections.questions.question');

    if (!exam) throw ApiError.notFound('Exam not found or not available');

    if (exam.accessCode && exam.accessCode !== accessCode) {
      throw ApiError.forbidden('Invalid access code');
    }

    // Check scheduling
    const now = new Date();
    if (exam.settings.scheduledStart && now < exam.settings.scheduledStart) {
      throw ApiError.badRequest('Exam has not started yet');
    }
    if (exam.settings.scheduledEnd && now > exam.settings.scheduledEnd) {
      throw ApiError.badRequest('Exam has ended');
    }

    // Check existing attempt
    const existingAttempt = await ExamAttempt.findOne({
      exam: examId,
      student: req.user._id,
      status: 'in_progress',
    });

    if (existingAttempt) {
      // Resume existing attempt
      const populatedExam = await Exam.findById(examId).populate('sections.questions.question');
      return ApiResponse.success(res, { attempt: existingAttempt, exam: sanitizeExamForStudent(populatedExam) }, 'Resuming attempt');
    }

    // Check max attempts
    const attemptCount = await ExamAttempt.countDocuments({ exam: examId, student: req.user._id });
    if (attemptCount >= exam.settings.maxAttempts) {
      throw ApiError.badRequest('Maximum attempts reached');
    }

    // Create access record
    await StudentExamAccess.findOneAndUpdate(
      { exam: examId, student: req.user._id },
      { accessGranted: true, accessMethod: accessCode ? 'code' : 'link' },
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

    ApiResponse.created(res, { attempt, exam: sanitizeExamForStudent(exam) }, 'Exam started');
  } catch (error) { next(error); }
};

exports.saveAnswer = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { questionId, selectedOption, textAnswer, codeAnswer, codeLanguage, markedForReview } = req.body;

    const attempt = await ExamAttempt.findOne({
      _id: attemptId,
      student: req.user._id,
      status: 'in_progress',
    });
    if (!attempt) throw ApiError.notFound('Attempt not found or already submitted');

    const answerIndex = attempt.answers.findIndex(a => a.question?.toString() === questionId);

    const answerData = {
      question: questionId,
      selectedOption: selectedOption || null,
      textAnswer: textAnswer || '',
      codeAnswer: codeAnswer || '',
      codeLanguage: codeLanguage || '',
      markedForReview: markedForReview || false,
    };

    if (answerIndex >= 0) {
      attempt.answers[answerIndex] = { ...attempt.answers[answerIndex].toObject(), ...answerData };
    } else {
      attempt.answers.push(answerData);
    }

    attempt.autoSavedAt = new Date();
    await attempt.save();

    ApiResponse.success(res, { saved: true }, 'Answer saved');
  } catch (error) { next(error); }
};

const sandboxService = require('../services/sandboxService');

exports.submitAttempt = async (req, res, next) => {
  let attempt;
  try {
    attempt = await ExamAttempt.findOne({
      _id: req.params.attemptId,
      student: req.user._id,
      status: 'in_progress',
    });
    if (!attempt) throw ApiError.notFound('Attempt not found or already submitted');

    const exam = await Exam.findById(attempt.exam).populate('sections.questions.question');
    if (!exam) throw ApiError.notFound('Exam not found');

    // Server-side timing check with 30s buffer
    const startedAt = attempt.startedAt.getTime();
    const duration = exam.settings?.duration || 0;
    if (Date.now() > startedAt + duration * 60000 + 30000) {
      throw ApiError.badRequest('Submission window expired');
    }

    // Auto-evaluate MCQs and Coding questions
    let totalScore = 0;
    let maxScore = 0;

    const allQuestions = exam.sections.flatMap(s => s.questions);

    const evaluationPromises = allQuestions.map(async (sq) => {
      const q = sq.question;
      if (!q) return { marks: 0, maxMarks: 0 };
      const maxMarks = sq.marks || q.marks || 0;

      const answer = attempt.answers.find(a => a.question?.toString() === q._id.toString());
      if (!answer) return { marks: 0, maxMarks };

      if (q.type === 'mcq') {
        const correctOption = q.options.find(o => o.isCorrect);
        if (correctOption && answer.selectedOption === correctOption.label) {
          return { marks: maxMarks, maxMarks };
        } else if (answer.selectedOption && exam.settings?.negativeMarking && q.negativeMarks > 0) {
          return { marks: -q.negativeMarks, maxMarks };
        }
        return { marks: 0, maxMarks };
      } 
      else if (q.type === 'coding' && answer.codeAnswer) {
        try {
          const runResult = await sandboxService.execute(
            answer.codeAnswer, 
            answer.codeLanguage || 'javascript', 
            q.testCases || []
          );
          
          answer.codingResults = runResult.results;
          // Award marks based on percentage of passed test cases
          const awarded = Math.round((runResult.passedCount / (runResult.totalCount || 1)) * maxMarks);
          return { marks: awarded, maxMarks };
        } catch (err) {
          console.error('Coding evaluation failed:', err);
          answer.codingResults = [{ status: 'error', actualOutput: err.message }];
          return { marks: 0, maxMarks };
        }
      }
      return { marks: 0, maxMarks };
    });

    const results = await Promise.allSettled(evaluationPromises);

    results.forEach(r => {
      if (r.status === 'fulfilled') {
        totalScore += r.value.marks;
        maxScore += r.value.maxMarks;
      }
    });

    attempt.status = 'submitted';
    attempt.submittedAt = new Date();
    attempt.totalScore = totalScore;
    attempt.maxScore = maxScore;
    attempt.percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    attempt.timeSpent = Math.round((Date.now() - attempt.startedAt.getTime()) / 1000);
    
    // Crucial: mark modified if we changed subdocuments manually and save
    attempt.markModified('answers');
    await attempt.save();

    await AccessLog.create({
      userId: req.user._id,
      exam: attempt.exam,
      action: 'exam_submitted',
      ip: req.ip,
    });

    ApiResponse.success(res, {
      attempt: {
        _id: attempt._id,
        totalScore: attempt.totalScore,
        maxScore: attempt.maxScore,
        percentage: attempt.percentage,
        submittedAt: attempt.submittedAt,
      },
    }, 'Exam submitted successfully');
  } catch (error) { 
    next(error); 
  } finally {
    // Safety check: if standard flow failed mid-execution but we loaded the attempt,
    // ensure it is marked as submitted and not stuck in 'in_progress'
    if (attempt && attempt.status === 'in_progress') {
      try {
        attempt.status = 'submitted';
        attempt.submittedAt = new Date();
        attempt.timeSpent = Math.round((Date.now() - attempt.startedAt.getTime()) / 1000);
        await attempt.save();
      } catch (saveErr) {
        console.error('Failed to auto-submit attempt in finally block:', saveErr);
      }
    }
  }
};

exports.getMyAttempts = async (req, res, next) => {
  try {
    const attempts = await ExamAttempt.find({ student: req.user._id })
      .populate('exam', 'title subject settings.duration')
      .sort('-createdAt');
    ApiResponse.success(res, { attempts });
  } catch (error) { next(error); }
};

exports.getAttempt = async (req, res, next) => {
  try {
    const attempt = await ExamAttempt.findOne({
      _id: req.params.attemptId,
      student: req.user._id,
    })
      .populate({
        path: 'exam',
        populate: { path: 'sections.questions.question' }
      })
      .populate('answers.question');
      
    if (!attempt) throw ApiError.notFound('Attempt not found');

    const attemptData = attempt.toObject();
    if (attempt.exam) {
      attemptData.exam = sanitizeExamForStudent(attempt.exam);
    }
    
    ApiResponse.success(res, { attempt: attemptData });
  } catch (error) { next(error); }
};

exports.getExamAttempts = async (req, res, next) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.examId, institution: req.user.institution });
    if (!exam) throw ApiError.notFound('Exam not found');

    const attempts = await ExamAttempt.find({ exam: req.params.examId })
      .populate('student', 'name email')
      .sort('-submittedAt');

    ApiResponse.success(res, { attempts });
  } catch (error) { next(error); }
};

function sanitizeExamForStudent(exam) {
  const sanitized = typeof exam.toObject === 'function' ? exam.toObject() : { ...exam };
  sanitized.sections?.forEach(section => {
    section.questions.forEach(sq => {
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

exports.generateFeedback = async (req, res, next) => {
  try {
    let attempt;

    if (req.user.role === 'student') {
      attempt = await ExamAttempt.findOne({
        _id: req.params.attemptId,
        student: req.user._id,
        status: 'submitted',
      });
    } else {
      // Faculty, evaluator, super admin, or owner: verify the attempt belongs to their institution
      attempt = await ExamAttempt.findById(req.params.attemptId).populate('exam');
      if (attempt && attempt.exam) {
        if (attempt.exam.institution?.toString() !== req.user.institution?.toString()) {
          throw ApiError.forbidden('You do not have access to this attempt');
        }
      } else {
        attempt = null;
      }
    }

    if (!attempt || attempt.status !== 'submitted') {
      throw ApiError.notFound('Attempt not found or not submitted');
    }

    if (attempt.aiFeedback && attempt.aiFeedback.overall) {
      return ApiResponse.success(res, { feedback: attempt.aiFeedback });
    }

    // Schedule background job for feedback generation
    await scheduleJob('generate-ai-feedback', { attemptId: attempt._id });

    // Respond with 202 Accepted
    res.status(202).json({
      success: true,
      message: 'Feedback generation queued. Check back in ~30 seconds.',
    });
  } catch (error) { next(error); }
};

exports.executeCode = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { questionId, code, language } = req.body;

    const attempt = await ExamAttempt.findOne({
      _id: attemptId,
      student: req.user._id,
      status: 'in_progress',
    });
    if (!attempt) throw ApiError.notFound('Attempt not found or already submitted');

    const question = await QuestionBankItem.findById(questionId);
    if (!question) throw ApiError.notFound('Question not found');

    // Filter out hidden test cases for real-time execution
    const publicTestCases = (question.testCases || []).filter(tc => !tc.isHidden);
    
    const result = await sandboxService.execute(code, language, publicTestCases);
    
    ApiResponse.success(res, { result }, 'Code executed successfully');
  } catch (error) { next(error); }
};

