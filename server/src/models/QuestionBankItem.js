const mongoose = require('mongoose');

const questionBankItemSchema = new mongoose.Schema({
  type: { type: String, enum: ['mcq', 'subjective', 'coding'], required: true },
  text: { type: String, required: true },
  options: [{
    label: { type: String },
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
  }],
  correctAnswer: { type: String, default: '' },
  explanation: { type: String, default: '' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'expert'], default: 'medium' },
  bloomLevel: {
    type: String,
    enum: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'],
    default: 'understand',
  },
  subject: { type: String, default: '' },
  topic: { type: String, default: '' },
  unit: { type: String, default: '' },
  marks: { type: Number, default: 1 },
  negativeMarks: { type: Number, default: 0 },
  estimatedTime: { type: Number, default: 2 },
  rubric: { type: String, default: '' },
  modelAnswer: { type: String, default: '' },
  tags: [{ type: String }],
  learningOutcome: { type: String, default: '' },
  qualityScore: { type: Number, default: null, min: 0, max: 100 },
  qualityFlags: [{ type: String }],
  // Coding question fields
  starterCode: { type: String, default: '' },
  supportedLanguages: [{ type: String }],
  testCases: [{
    input: { type: String },
    expectedOutput: { type: String },
    isHidden: { type: Boolean, default: false },
    description: { type: String, default: '' },
  }],
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  source: { type: String, enum: ['manual', 'ai_generated', 'imported'], default: 'manual' },
  aiGenerationId: { type: mongoose.Schema.Types.ObjectId, ref: 'AiGenerationLog', default: null },
  versions: [{
    text: String,
    options: Array,
    correctAnswer: String,
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

questionBankItemSchema.index({ institution: 1, subject: 1, topic: 1 });
questionBankItemSchema.index({ institution: 1, type: 1, difficulty: 1 });
questionBankItemSchema.index({ text: 'text' });

module.exports = mongoose.model('QuestionBankItem', questionBankItemSchema);
