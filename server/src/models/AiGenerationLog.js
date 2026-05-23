const mongoose = require('mongoose');

const aiGenerationLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', default: null },
  provider: { type: String, default: 'nvidia' },
  model: { type: String, required: true },
  promptVersion: { type: String, default: '1.0' },
  promptTemplate: { type: String, default: '' },
  prompt: { type: String, required: true },
  rawResponse: { type: String, default: '' },
  parsedOutput: { type: mongoose.Schema.Types.Mixed, default: null },
  status: { type: String, enum: ['success', 'failed', 'partial', 'timeout'], default: 'success' },
  error: { type: String, default: null },
  generationType: {
    type: String,
    enum: ['exam', 'questions', 'blueprint', 'rubric', 'quality_check', 'copilot', 'improvement', 'review'],
    required: true,
  },
  tokensUsed: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', default: null },
  resourcesUsed: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ResourceFile' }],
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

aiGenerationLogSchema.index({ userId: 1, createdAt: -1 });
aiGenerationLogSchema.index({ institution: 1, generationType: 1 });

module.exports = mongoose.model('AiGenerationLog', aiGenerationLogSchema);
