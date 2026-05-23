const mongoose = require('mongoose');

const resourceFileSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  path: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  tags: [{ type: String }],
  subject: { type: String, default: '' },
  description: { type: String, default: '' },
  folder: { type: String, default: 'general' },
  useForAi: { type: Boolean, default: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

resourceFileSchema.index({ institution: 1, tags: 1 });

module.exports = mongoose.model('ResourceFile', resourceFileSchema);
