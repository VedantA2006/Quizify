const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 200 },
  slug: { type: String, required: true, unique: true, lowercase: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, default: '', maxlength: 1000 },
  type: { type: String, enum: ['college', 'school', 'coaching', 'training', 'other'], default: 'other' },
  website: { type: String, default: null },
  logo: { type: String, default: null },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: '' },
    zip: { type: String, default: '' },
  },
  settings: {
    allowPublicExams: { type: Boolean, default: true },
    requireApproval: { type: Boolean, default: false },
    defaultExamDuration: { type: Number, default: 60 },
  },
  plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
  quotas: {
    aiGenerationsLimit: { type: Number, default: 10 },
    aiGenerationsUsed: { type: Number, default: 0 },
    maxStudents: { type: Number, default: 100 },
    storageLimitGB: { type: Number, default: 1 },
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Institution', institutionSchema);
