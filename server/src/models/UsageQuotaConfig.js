const mongoose = require('mongoose');

const usageQuotaConfigSchema = new mongoose.Schema({
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true, unique: true },
  aiGenerationsLimit: { type: Number, default: 1000 },
  storageLimit: { type: Number, default: 5000 },
  examsLimit: { type: Number, default: 500 },
  currentUsage: {
    aiGenerations: { type: Number, default: 0 },
    storageUsed: { type: Number, default: 0 },
    examsCreated: { type: Number, default: 0 },
  },
  resetDate: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('UsageQuotaConfig', usageQuotaConfigSchema);
