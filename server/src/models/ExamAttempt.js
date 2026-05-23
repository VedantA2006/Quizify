const mongoose = require('mongoose');

const examAttemptSchema = new mongoose.Schema({
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: [{
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionBankItem' },
    sectionIndex: { type: Number, default: 0 },
    selectedOption: { type: String, default: null },
    textAnswer: { type: String, default: '' },
    codeAnswer: { type: String, default: '' },
    codeLanguage: { type: String, default: '' },
    codingResults: [{
      testCaseId: Number,
      status: { type: String, enum: ['passed', 'failed', 'error'] },
      input: String,
      expectedOutput: String,
      actualOutput: String,
      executionTime: Number,
      memoryUsage: Number,
      isHidden: Boolean,
    }],
    markedForReview: { type: Boolean, default: false },
    timeTaken: { type: Number, default: 0 },
  }],
  startedAt: { type: Date, default: Date.now },
  submittedAt: { type: Date, default: null },
  status: {
    type: String,
    enum: ['in_progress', 'submitted', 'evaluated', 'published'],
    default: 'in_progress',
  },
  totalScore: { type: Number, default: null },
  maxScore: { type: Number, default: null },
  percentage: { type: Number, default: null },
  autoSavedAt: { type: Date, default: null },
  aiFeedback: {
    overall: { type: String, default: null },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    recommendations: [{ type: String }],
  },
  ip: { type: String, default: '' },
  timeSpent: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

examAttemptSchema.index({ exam: 1, student: 1 });
examAttemptSchema.index({ student: 1, status: 1 });

module.exports = mongoose.model('ExamAttempt', examAttemptSchema);
