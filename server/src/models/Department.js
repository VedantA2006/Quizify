const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  head: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

departmentSchema.index({ institution: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Department', departmentSchema);
