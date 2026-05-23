const ExamAttempt = require('../models/ExamAttempt');
const Exam = require('../models/Exam');
const StudentExamAccess = require('../models/StudentExamAccess');
const AccessLog = require('../models/AccessLog');
const QuestionBankItem = require('../models/QuestionBankItem');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const aiService = require('../services/ai/aiService');

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
  try {
    const attempt = await ExamAttempt.findOne({
      _id: req.params.attemptId,
      student: req.user._id,
      status: 'in_progress',
    });
    if (!attempt) throw ApiError.notFound('Attempt not found or already submitted');

    const exam = await Exam.findById(attempt.exam).populate('sections.questions.question');

    // Auto-evaluate MCQs and Coding questions
    let totalScore = 0;
    let maxScore = 0;

    const allQuestions = exam.sections.flatMap(s => s.questions);

    for (const sq of allQuestions) {
      const q = sq.question;
      if (!q) continue;
      maxScore += sq.marks || q.marks || 0;

      const answer = attempt.answers.find(a => a.question?.toString() === q._id.toString());
      if (!answer) continue;

      if (q.type === 'mcq') {
        const correctOption = q.options.find(o => o.isCorrect);
        if (correctOption && answer.selectedOption === correctOption.label) {
          totalScore += sq.marks || q.marks || 0;
        } else if (answer.selectedOption && exam.settings.negativeMarking) {
          totalScore -= q.negativeMarks || 0;
        }
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
          const awarded = Math.round((runResult.passedCount / (runResult.totalCount || 1)) * (sq.marks || q.marks || 0));
          totalScore += awarded;
        } catch (err) {
          console.error('Coding evaluation failed:', err);
          answer.codingResults = [{ status: 'error', actualOutput: err.message }];
        }
      }
    }

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
  } catch (error) { next(error); }
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
    const attempt = await ExamAttempt.findOne({
      _id: req.params.attemptId,
      student: req.user._id,
      status: 'submitted',
    }).populate('exam').populate('answers.question');

    if (!attempt) throw ApiError.notFound('Attempt not found or not submitted');

    if (attempt.aiFeedback && attempt.aiFeedback.overall) {
      return ApiResponse.success(res, { feedback: attempt.aiFeedback });
    }

    const qaData = attempt.answers.map(a => `
Q: ${a.question?.text || 'Unknown Question'}
Student Answer: ${a.textAnswer || a.codeAnswer || a.selectedOption || 'No answer provided'}
Correct Answer: ${a.question?.correctAnswer || 'N/A (subjective)'}
Marks Awarded: ${a.markedForReview ? 'Pending' : 'Auto-graded'}
`).join('\n');

    const params = {
      examTitle: attempt.exam?.title,
      subject: attempt.exam?.subject,
      score: attempt.totalScore,
      maxScore: attempt.maxScore,
      percentage: attempt.percentage,
      qaData,
    };

    const aiResult = await aiService.generateReview(params, req.user._id, req.user.institution);
    if (!aiResult.success) throw new ApiError(500, 'AI Feedback generation failed: ' + aiResult.error);

    attempt.aiFeedback = aiResult.data;
    await attempt.save();

    ApiResponse.success(res, { feedback: attempt.aiFeedback });
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

