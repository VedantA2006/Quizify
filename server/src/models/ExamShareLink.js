const mongoose = require('mongoose');

const examShareLinkSchema = new mongoose.Schema({
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  slug: { type: String, required: true, unique: true, index: true },
  type: { type: String, enum: ['open', 'password', 'invite_only'], default: 'open' },
  password: { type: String, default: null },
  label: { type: String, default: 'Main Link' },
  maxUses: { type: Number, default: null },
  usedCount: { type: Number, default: 0 },
  expiresAt: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  allowedEmails: [{ type: String }],
  joinedStudents: [{ 
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
    ip: String
  }],
  utmSource: { type: String, default: null }
}, { timestamps: true });

examShareLinkSchema.index({ exam: 1 });
examShareLinkSchema.index({ institution: 1, createdBy: 1 });

module.exports = mongoose.model('ExamShareLink', examShareLinkSchema);
