const mongoose = require('mongoose');

const aiConversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', default: null },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', default: null },
  title: { type: String, default: 'New Conversation' },
  messages: [{
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now },
  }],
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
  generationIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AiGenerationLog' }],
}, { timestamps: true });

aiConversationSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('AiConversation', aiConversationSchema);
