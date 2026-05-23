require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const Exam = require('./src/models/Exam');
const User = require('./src/models/User');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const faculty = await User.findOne({ email: 'faculty@quzify.com' });
    const exam = await Exam.findOne({ _id: '69c4e4e5a65de8e06c4d66a3', institution: faculty.institution });
    
    if (!exam) throw new Error('Exam not found');

    const totalQuestions = exam.sections.reduce((sum, s) => sum + s.questions.length, 0);
    console.log('Total questions:', totalQuestions);

    exam.status = 'published';
    exam.publishedAt = new Date();
    exam.accessCode = exam.accessCode || 'TEST12';
    
    await exam.save();
    console.log('Successfully published!');
  } catch (err) {
    console.error('Publish error:', err);
  } finally {
    process.exit();
  }
}

test();
