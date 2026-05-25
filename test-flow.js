const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function runTest() {
  console.log('🚀 Starting Integration Test...');
  
  const timestamp = Date.now();
  const testEmail = `test_${timestamp}@quizify.com`;

  try {
    // 1. Register a new Student
    console.log(`👤 Registering new Student: ${testEmail}...`);
    await axios.post(`${API_URL}/auth/register`, {
      name: 'Test Student',
      email: testEmail,
      password: 'password123',
      role: 'student'
    });
    console.log('✅ Registered successfully');

    // 2. Login
    console.log('🔑 Logging in...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: testEmail,
      password: 'password123'
    });
    const token = loginRes.data.data.token;
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
    console.log('✅ Logged in successfully');

    // 3. Get exam preview
    console.log('📚 Fetching available exams...');
    const examsRes = await axios.get(`${API_URL}/exams/code/DEMO24`);
    const examPreview = examsRes.data.data.exam;
    console.log(`✅ Found exam: ${examPreview.title} (ID: ${examPreview._id})`);

    // 4. Start attempt
    console.log('⏱️ Starting exam attempt...');
    const startRes = await axios.post(`${API_URL}/attempts/start`, { 
      examId: examPreview._id,
      accessCode: 'DEMO24'
    }, authHeaders);
    const attempt = startRes.data.data.attempt;
    const attemptId = attempt._id;
    console.log(`✅ Attempt created: ${attemptId}`);

    // Fetch full attempt details
    console.log('🔍 Fetching full attempt details...');
    const attemptDetailsRes = await axios.get(`${API_URL}/attempts/${attemptId}`, authHeaders);
    const fullAttempt = attemptDetailsRes.data.data.attempt;
    const questions = fullAttempt.exam.sections.flatMap(s => s.questions);

    // 5. Find coding question & Run Tests
    console.log('💻 Checking for coding questions...');
    const codingQ = questions.find(q => q.question.type === 'coding');
    if (codingQ) {
      console.log('🚀 Running tests for coding question...');
      const executeRes = await axios.post(`${API_URL}/attempts/${attemptId}/execute`, {
        questionId: codingQ.question._id,
        code: 'function reverseLinkedList(head) { return head; }',
        language: 'javascript'
      }, authHeaders);
      
      const result = executeRes.data.data.result;
      console.log(`✅ Execution result: ${result.passedCount}/${result.totalCount} passed`);

      console.log('💾 Saving coding answer...');
      await axios.put(`${API_URL}/attempts/${attemptId}/save`, {
        questionId: codingQ.question._id,
        codeAnswer: 'function reverseLinkedList(head) { return head; }',
        codeLanguage: 'javascript'
      }, authHeaders);
      console.log('✅ Answer saved');
    }

    // 6. Submit Attempt
    console.log('📤 Submitting exam...');
    const submitRes = await axios.post(`${API_URL}/attempts/${attemptId}/submit`, {}, authHeaders);
    console.log('✅ Submitted! Score:', submitRes.data.data.attempt.totalScore, '/', submitRes.data.data.attempt.maxScore);

    console.log('\n✨ Integration Test Passed Perfectly!');
  } catch (error) {
    console.error('\n❌ Test Failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

runTest();
