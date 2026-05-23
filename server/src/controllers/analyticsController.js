const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const QuestionBankItem = require('../models/QuestionBankItem');
const User = require('../models/User');
const AiGenerationLog = require('../models/AiGenerationLog');
const ApiResponse = require('../utils/ApiResponse');

exports.getInstitutionAnalytics = async (req, res, next) => {
  try {
    const instId = req.user.institution;

    const examIds = await Exam.find({ institution: instId }).select('_id').then(e => e.map(x => x._id));

    const [
      totalExams, 
      totalQuestions, 
      totalStudents, 
      totalFaculty, 
      totalAttempts, 
      aiGenerations,
      attemptsStats
    ] = await Promise.all([
      Exam.countDocuments({ institution: instId, isActive: true }),
      QuestionBankItem.countDocuments({ institution: instId, isActive: true }),
      User.countDocuments({ institution: instId, role: 'student', isActive: true }),
      User.countDocuments({ institution: instId, role: 'faculty', isActive: true }),
      ExamAttempt.countDocuments({ exam: { $in: examIds } }),
      AiGenerationLog.countDocuments({ institution: instId }),
      ExamAttempt.aggregate([
        { $match: { exam: { $in: examIds }, status: { $in: ['submitted', 'evaluated', 'published'] } } },
        { $group: {
          _id: null,
          avgScore: { $avg: '$percentage' },
          avgTime: { $avg: '$timeSpent' },
          passCount: { $sum: { $cond: [{ $gte: ['$percentage', 40] }, 1, 0] } }, // Assuming 40% pass
          total: { $sum: 1 }
        }}
      ])
    ]);

    const stats = attemptsStats[0] || { avgScore: 0, avgTime: 0, passCount: 0, total: 0 };

    const recentExams = await Exam.find({ institution: instId, isActive: true })
      .select('title subject status createdAt')
      .sort('-createdAt')
      .limit(5);

    const examsByStatus = await Exam.aggregate([
      { $match: { institution: instId, isActive: true } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const submissionTrend = await ExamAttempt.aggregate([
      { $match: { exam: { $in: examIds }, createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    ApiResponse.success(res, {
      overview: { 
        totalExams, totalQuestions, totalStudents, totalFaculty, totalAttempts, aiGenerations,
        passRate: stats.total ? Math.round((stats.passCount / stats.total) * 100) : 0,
        avgScore: Math.round(stats.avgScore || 0),
        avgCompletionTime: Math.round((stats.avgTime || 0) / 60), // in minutes
      },
      recentExams,
      examsByStatus,
      submissionTrend,
    });
  } catch (error) { next(error); }
};


exports.getExamAnalytics = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    const attempts = await ExamAttempt.find({ exam: req.params.examId, status: { $in: ['submitted', 'evaluated', 'published'] } });

    const scores = attempts.map(a => a.percentage || 0);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const maxScore = scores.length ? Math.max(...scores) : 0;
    const minScore = scores.length ? Math.min(...scores) : 0;

    const scoreDistribution = [
      { range: '0-20', count: scores.filter(s => s <= 20).length },
      { range: '21-40', count: scores.filter(s => s > 20 && s <= 40).length },
      { range: '41-60', count: scores.filter(s => s > 40 && s <= 60).length },
      { range: '61-80', count: scores.filter(s => s > 60 && s <= 80).length },
      { range: '81-100', count: scores.filter(s => s > 80).length },
    ];

    const completionRate = attempts.length > 0
      ? Math.round((attempts.filter(a => a.status !== 'in_progress').length / attempts.length) * 100)
      : 0;

    const avgTimeSpent = attempts.length
      ? Math.round(attempts.reduce((a, b) => a + (b.timeSpent || 0), 0) / attempts.length / 60)
      : 0;

    ApiResponse.success(res, {
      examTitle: exam?.title,
      totalAttempts: attempts.length,
      avgScore,
      maxScore,
      minScore,
      scoreDistribution,
      completionRate,
      avgTimeSpent,
    });
  } catch (error) { next(error); }
};

exports.getQuestionAnalytics = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const attempts = await ExamAttempt.find({
      exam: examId,
      status: { $in: ['submitted', 'evaluated', 'published'] },
    });

    const exam = await Exam.findById(examId).populate('sections.questions.question');
    const allQuestions = exam.sections.flatMap(s => s.questions.map(q => q.question)).filter(Boolean);

    const questionStats = allQuestions.map(q => {
      const responses = attempts.map(a => a.answers.find(ans => ans.question?.toString() === q._id.toString())).filter(Boolean);
      const correctCount = responses.filter(r => {
        if (q.type === 'mcq') {
          const correct = q.options.find(o => o.isCorrect);
          return r.selectedOption === correct?.label;
        }
        return false;
      }).length;

      return {
        questionId: q._id,
        text: q.text.substring(0, 100),
        type: q.type,
        difficulty: q.difficulty,
        totalResponses: responses.length,
        correctCount,
        accuracy: responses.length ? Math.round((correctCount / responses.length) * 100) : 0,
        unattempted: attempts.length - responses.length,
      };
    });

    ApiResponse.success(res, { questionStats });
  } catch (error) { next(error); }
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    if (role === 'student') {
      const attempts = await ExamAttempt.find({ student: userId })
        .populate('exam', 'title subject')
        .sort('-createdAt')
        .limit(10);

      const totalAttempts = await ExamAttempt.countDocuments({ student: userId });
      const avgScore = await ExamAttempt.aggregate([
        { $match: { student: userId, status: { $in: ['submitted', 'evaluated', 'published'] } } },
        { $group: { _id: null, avg: { $avg: '$percentage' } } },
      ]);

      return ApiResponse.success(res, {
        totalAttempts,
        avgScore: Math.round(avgScore[0]?.avg || 0),
        recentAttempts: attempts,
      });
    }

    if (role === 'faculty') {
      const [myExams, myQuestions, myGenerations] = await Promise.all([
        Exam.countDocuments({ createdBy: userId, isActive: true }),
        QuestionBankItem.countDocuments({ createdBy: userId, isActive: true }),
        AiGenerationLog.countDocuments({ userId }),
      ]);

      const recentExams = await Exam.find({ createdBy: userId, isActive: true })
        .select('title status createdAt')
        .sort('-createdAt')
        .limit(5);

      return ApiResponse.success(res, { myExams, myQuestions, myGenerations, recentExams });
    }

    if (role === 'evaluator') {
      const pendingEvals = await ExamAttempt.countDocuments({
        exam: { $in: await Exam.find({ institution: req.user.institution }).select('_id').then(e => e.map(x => x._id)) },
        status: 'submitted',
      });

      return ApiResponse.success(res, { pendingEvaluations: pendingEvals });
    }

    ApiResponse.success(res, {});
  } catch (error) { next(error); }
};
