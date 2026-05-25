require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const aiService = require('./src/services/ai/aiService');
const User = require('./src/models/User');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const faculty = await User.findOne({ email: 'faculty@quizify.com' });
    if (!faculty) throw new Error('Faculty not found');

    const params = {
      subject: 'Javascript',
      topics: 'Variables',
      questionCount: 5,
      duration: 10,
      questionTypes: ['mcq']
    };

    console.log('Generating exam...');
    const result = await aiService.generateExam(params, faculty._id, faculty.institution);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error in test:', err);
  } finally {
    process.exit();
  }
}

test();
