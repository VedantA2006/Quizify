/**
 * Background Jobs Queue Service using Agenda with MongoDB storage
 */

const Agenda = require('agenda');
const env = require('../config/env');
const ExamAttempt = require('../models/ExamAttempt');
const Exam = require('../models/Exam');
const User = require('../models/User');
const aiService = require('../services/ai/aiService');
const sandboxService = require('../services/sandboxService');
const nodemailer = require('nodemailer');

const agenda = new Agenda({
  db: { address: env.MONGODB_URI, collection: 'agendaJobs' },
  processEvery: '10 seconds',
});

// Configure standard transactional Mail Transporter
const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

let isStarted = false;

const startQueue = async () => {
  if (isStarted) return;
  try {
    await agenda.start();
    isStarted = true;
    console.log('[Queue] Agenda background processing service started successfully.');
  } catch (err) {
    console.error('[Queue] Failed to initialize Agenda:', err);
  }
};

// Define 1: Generate AI Feedback and constructive critique
agenda.define('generate-ai-feedback', async (job) => {
  const { attemptId } = job.attrs.data;
  console.log(`[Job] Generating AI feedback for attempt: ${attemptId}`);

  const attempt = await ExamAttempt.findById(attemptId);
  if (!attempt) throw new Error(`ExamAttempt ${attemptId} not found`);

  const exam = await Exam.findById(attempt.exam);
  if (!exam) throw new Error(`Exam ${attempt.exam} not found`);

  // Build high-context QA structure for personalized evaluation
  const qaData = attempt.answers.map((ans, index) => {
    return `Question ${index + 1}:
Type: ${ans.questionType || 'unknown'}
Selected/Provided Option: ${ans.selectedOption || 'N/A'}
Code Answer: ${ans.codeAnswer || 'N/A'}
Score Gained: ${ans.scoreAwarded || 0}`;
  }).join('\n\n');

  const reviewResult = await aiService.generateReview({
    examTitle: exam.title,
    subject: exam.subject,
    score: attempt.totalScore,
    maxScore: attempt.maxScore,
    percentage: attempt.percentage,
    qaData,
  }, attempt.student, exam.institution);

  if (reviewResult.success) {
    attempt.aiFeedback = reviewResult.data;
    await attempt.save();
    console.log(`[Job] AI feedback generated successfully for attempt: ${attemptId}`);
  } else {
    throw new Error(reviewResult.error || 'AI Feedback evaluation failed');
  }
});

// Define 2: Send transactional HTML emails
agenda.define('send-email', async (job) => {
  const { to, subject, html, text } = job.attrs.data;
  console.log(`[Job] Dispatching transactional email to: ${to}`);

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
    text,
  });

  console.log(`[Job] Transactional email sent successfully to: ${to}`);
});

// Define 3: Run real-time sandbox execution for coding questions in attempts
agenda.define('evaluate-coding-attempt', async (job) => {
  const { attemptId } = job.attrs.data;
  console.log(`[Job] Evaluating sandbox coding questions for attempt: ${attemptId}`);

  const attempt = await ExamAttempt.findById(attemptId);
  if (!attempt) throw new Error(`ExamAttempt ${attemptId} not found`);

  const exam = await Exam.findById(attempt.exam).populate('sections.questions.question');
  if (!exam) throw new Error(`Exam ${attempt.exam} not found`);

  let totalScore = attempt.totalScore || 0;
  const allQuestions = exam.sections.flatMap(s => s.questions);

  for (const sq of allQuestions) {
    const q = sq.question;
    if (!q || q.type !== 'coding') continue;

    const answer = attempt.answers.find(a => a.question?.toString() === q._id.toString());
    if (!answer || !answer.codeAnswer) continue;

    const runResult = await sandboxService.execute(
      answer.codeAnswer,
      answer.codeLanguage || 'javascript',
      q.testCases || []
    );

    answer.codingResults = runResult.results;
    const awarded = Math.round((runResult.passedCount / (runResult.totalCount || 1)) * (sq.marks || q.marks || 0));
    totalScore += awarded;
  }

  attempt.totalScore = totalScore;
  attempt.percentage = attempt.maxScore > 0 ? Math.round((totalScore / attempt.maxScore) * 100) : 0;
  attempt.markModified('answers');
  await attempt.save();

  console.log(`[Job] Coding evaluations completed successfully for attempt: ${attemptId}`);
});

// Define 4: Publish exam results and notify students
agenda.define('publish-results', async (job) => {
  const { examId } = job.attrs.data;
  console.log(`[Job] Launching publish result flow for exam: ${examId}`);

  const exam = await Exam.findById(examId);
  if (!exam) throw new Error(`Exam ${examId} not found`);

  const attempts = await ExamAttempt.find({ exam: examId });

  for (const attempt of attempts) {
    attempt.status = 'submitted';
    await attempt.save();

    const student = await User.findById(attempt.student);
    if (student && student.email) {
      await agenda.now('send-email', {
        to: student.email,
        subject: `Results Published: ${exam.title}`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #4f46e5; margin-bottom: 20px;">Quizify Exam Results</h2>
            <p>Dear ${student.name || 'Student'},</p>
            <p>Your results for <strong>${exam.title}</strong> have been published and are ready for view.</p>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #4f46e5;">
              <p style="margin: 5px 0;"><strong>Your Score:</strong> ${attempt.totalScore} / ${attempt.maxScore}</p>
              <p style="margin: 5px 0;"><strong>Percentage:</strong> ${attempt.percentage}%</p>
            </div>
            <p>Best regards,<br/>The Quizify Assessment Team</p>
          </div>
        `,
      });
    }
  }

  console.log(`[Job] Completed publishing results and sent all emails for exam: ${examId}`);
});

const scheduleJob = async (name, data) => {
  await startQueue();
  return agenda.now(name, data);
};

module.exports = {
  agenda,
  startQueue,
  scheduleJob,
};
