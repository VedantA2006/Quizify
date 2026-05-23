const mongoose = require('mongoose');

const studentExamAccessSchema = new mongoose.Schema({
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  accessGranted: { type: Boolean, default: true },
  accessMethod: { type: String, enum: ['code', 'link', 'direct', 'class'], default: 'code' },
  grantedAt: { type: Date, default: Date.now },
  grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

studentExamAccessSchema.index({ exam: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('StudentExamAccess', studentExamAccessSchema);
