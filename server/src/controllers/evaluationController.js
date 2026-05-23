const EvaluationRecord = require('../models/EvaluationRecord');
const ExamAttempt = require('../models/ExamAttempt');
const Exam = require('../models/Exam');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

exports.getEvaluationQueue = async (req, res, next) => {
  try {
    const exams = await Exam.find({ institution: req.user.institution, status: 'published' }).select('_id');
    const examIds = exams.map(e => e._id);

    const attempts = await ExamAttempt.find({
      exam: { $in: examIds },
      status: 'submitted',
    })
      .populate('student', 'name email')
      .populate('exam', 'title subject')
      .sort('-submittedAt');

    ApiResponse.success(res, { attempts });
  } catch (error) { next(error); }
};

exports.evaluateAttempt = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { scores, overallRemarks } = req.body;

    const attempt = await ExamAttempt.findById(attemptId).populate('exam');
    if (!attempt) throw ApiError.notFound('Attempt not found');

    let totalScore = 0;
    let maxScore = 0;
    const evaluatedScores = scores.map(s => {
      totalScore += s.marksAwarded || 0;
      maxScore += s.maxMarks || 0;
      return {
        question: s.questionId,
        marksAwarded: s.marksAwarded,
        maxMarks: s.maxMarks,
        remarks: s.remarks || '',
      };
    });

    const evaluation = await EvaluationRecord.findOneAndUpdate(
      { attempt: attemptId },
      {
        attempt: attemptId,
        exam: attempt.exam._id,
        evaluatedBy: req.user._id,
        scores: evaluatedScores,
        totalScore,
        maxScore,
        percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
        overallRemarks: overallRemarks || '',
        status: 'completed',
      },
      { upsert: true, new: true }
    );

    // Update attempt
    attempt.status = 'evaluated';
    attempt.totalScore = totalScore;
    attempt.maxScore = maxScore;
    attempt.percentage = evaluation.percentage;
    await attempt.save();

    ApiResponse.success(res, { evaluation }, 'Evaluation saved');
  } catch (error) { next(error); }
};

exports.publishResults = async (req, res, next) => {
  try {
    const { examId } = req.params;

    const evaluations = await EvaluationRecord.updateMany(
      { exam: examId, status: 'completed' },
      { status: 'published', publishedAt: new Date() }
    );

    await ExamAttempt.updateMany(
      { exam: examId, status: 'evaluated' },
      { status: 'published' }
    );

    ApiResponse.success(res, { count: evaluations.modifiedCount }, 'Results published');
  } catch (error) { next(error); }
};

exports.getEvaluation = async (req, res, next) => {
  try {
    const evaluation = await EvaluationRecord.findOne({ attempt: req.params.attemptId })
      .populate('evaluatedBy', 'name')
      .populate('scores.question');
    if (!evaluation) throw ApiError.notFound('Evaluation not found');
    ApiResponse.success(res, { evaluation });
  } catch (error) { next(error); }
};
