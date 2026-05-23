const mongoose = require('mongoose');

const auditTrailSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  resource: { type: String, required: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  ip: { type: String, default: '' },
}, { timestamps: true });

auditTrailSchema.index({ userId: 1, createdAt: -1 });
auditTrailSchema.index({ resource: 1, action: 1 });

module.exports = mongoose.model('AuditTrail', auditTrailSchema);
