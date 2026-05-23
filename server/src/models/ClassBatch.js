const mongoose = require('mongoose');

const classBatchSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  faculty: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  academicYear: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('ClassBatch', classBatchSchema);
