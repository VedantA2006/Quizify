require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const Exam = require('./src/models/Exam');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const exam = await Exam.findOne({ _id: '69c4e4e5a65de8e06c4d66a3' });
    console.log('Exam status:', exam.status);
    console.log('Access code:', exam.accessCode);
  } finally {
    process.exit();
  }
}

test();
