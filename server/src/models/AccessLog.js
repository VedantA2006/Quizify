const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', default: null },
  action: { type: String, required: true },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  ip: { type: String, default: '' },
  userAgent: { type: String, default: '' },
}, { timestamps: true });

accessLogSchema.index({ exam: 1, createdAt: -1 });

module.exports = mongoose.model('AccessLog', accessLogSchema);
