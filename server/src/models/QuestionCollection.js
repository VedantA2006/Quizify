const mongoose = require('mongoose');

const questionCollectionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'QuestionBankItem' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tags: [{ type: String }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('QuestionCollection', questionCollectionSchema);
