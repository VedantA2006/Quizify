const mongoose = require('mongoose');

const evaluationRecordSchema = new mongoose.Schema({
  attempt: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamAttempt', required: true },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scores: [{
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionBankItem' },
    marksAwarded: { type: Number, default: 0 },
    maxMarks: { type: Number, default: 0 },
    remarks: { type: String, default: '' },
  }],
  totalScore: { type: Number, default: 0 },
  maxScore: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  overallRemarks: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'published'], default: 'pending' },
  publishedAt: { type: Date, default: null },
}, { timestamps: true });

evaluationRecordSchema.index({ attempt: 1 }, { unique: true });
evaluationRecordSchema.index({ exam: 1, status: 1 });

module.exports = mongoose.model('EvaluationRecord', evaluationRecordSchema);
