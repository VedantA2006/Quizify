const mongoose = require('mongoose');

const classExamScheduleSchema = new mongoose.Schema({
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassBatch', required: true },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  scheduledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shareLink: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamShareLink', default: null },
  scheduledStart: { type: Date, required: true },
  scheduledEnd: { type: Date, required: true },
  timezone: { type: String, default: 'UTC' },
  status: { 
    type: String, 
    enum: ['scheduled', 'live', 'completed', 'cancelled'], 
    default: 'scheduled' 
  },
  reminderSent: { type: Boolean, default: false },
  allowLateSubmission: { type: Boolean, default: false },
  lateSubmissionWindow: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  attendanceRecord: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['present', 'absent', 'late'] },
    markedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

classExamScheduleSchema.index({ class: 1, scheduledStart: 1 });
classExamScheduleSchema.index({ exam: 1 });
classExamScheduleSchema.index({ status: 1, scheduledStart: 1 });

module.exports = mongoose.model('ClassExamSchedule', classExamScheduleSchema);
