const mongoose = require('mongoose');

const classBatchSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  faculty: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  academicYear: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  
  // Custom Scheduling and classroom updates
  inviteCode: { type: String, default: null, unique: true, sparse: true },
  inviteLink: { type: String, default: null },
  inviteCodeExpiresAt: { type: Date, default: null },
  maxStudents: { type: Number, default: null },
  description: { type: String, default: '' },
  subject: { type: String, default: '' },
  semester: { type: String, default: '' },
  color: { type: String, default: '#0ea5e9' },
  coverEmoji: { type: String, default: '📚' },
  pinnedAnnouncements: [{ 
    text: String, 
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
    createdAt: { type: Date, default: Date.now },
    isPinned: { type: Boolean, default: false }
  }]
}, { timestamps: true });

module.exports = mongoose.model('ClassBatch', classBatchSchema);
