const mongoose = require('mongoose');
const { generateCode } = require('../utils/helpers');

const examSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  subject: { type: String, default: '' },
  topics: [{ type: String }],
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sections: [{
    title: { type: String, required: true },
    instructions: { type: String, default: '' },
    order: { type: Number, default: 0 },
    questions: [{
      question: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionBankItem' },
      order: { type: Number, default: 0 },
      marks: { type: Number },
    }],
  }],
  settings: {
    duration: { type: Number, default: 60 },
    totalMarks: { type: Number, default: 0 },
    passingMarks: { type: Number, default: 0 },
    negativeMarking: { type: Boolean, default: false },
    shuffleQuestions: { type: Boolean, default: false },
    shuffleOptions: { type: Boolean, default: false },
    showResults: { type: Boolean, default: true },
    allowReview: { type: Boolean, default: false },
    maxAttempts: { type: Number, default: 1 },
    scheduledStart: { type: Date, default: null },
    scheduledEnd: { type: Date, default: null },
    instructions: { type: String, default: '' },
  },
  status: {
    type: String,
    enum: ['draft', 'review', 'approved', 'published', 'archived'],
    default: 'draft',
  },
  accessCode: { type: String, default: () => generateCode(6) },
  publishedAt: { type: Date, default: null },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewComments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now },
  }],
  blueprint: {
    difficultyDistribution: { type: mongoose.Schema.Types.Mixed, default: {} },
    bloomDistribution: { type: mongoose.Schema.Types.Mixed, default: {} },
    topicCoverage: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  healthScore: { type: Number, default: null },
  versions: [{
    title: String,
    sections: Array,
    settings: Object,
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

examSchema.index({ institution: 1, status: 1 });
examSchema.index({ accessCode: 1 });
examSchema.index({ title: 'text', subject: 'text' });

examSchema.pre('save', function (next) {
  if (this.accessCode) {
    this.accessCode = this.accessCode.toString().replace(/\s+/g, '').toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Exam', examSchema);
