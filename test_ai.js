const aiService = require('./server/src/services/ai/aiService');
const mongoose = require('mongoose');
const env = require('./server/src/config/env');

async function test() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected.');

    const params = { prompt: 'Create a 1 question quiz about Earth' };
    const userId = new mongoose.Types.ObjectId();
    const institutionId = new mongoose.Types.ObjectId();

    console.log('Testing chatExamGeneration...');
    const result = await aiService.chatExamGeneration(params, userId, institutionId);
    
    if (result.success) {
      console.log('SUCCESS!');
      console.log(JSON.stringify(result.data, null, 2));
    } else {
      console.error('FAILED:', result.error);
    }
  } catch (err) {
    console.error('CRASH:', err);
  } finally {
    await mongoose.disconnect();
  }
}

test();
