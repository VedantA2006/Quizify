const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env.example') });

const env = require('../config/env');
const User = require('../models/User');
const Institution = require('../models/Institution');
const Department = require('../models/Department');
const ClassBatch = require('../models/ClassBatch');
const QuestionBankItem = require('../models/QuestionBankItem');
const QuestionCollection = require('../models/QuestionCollection');
const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const FeatureFlag = require('../models/FeatureFlag');
const UsageQuotaConfig = require('../models/UsageQuotaConfig');

const seed = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Institution.deleteMany({}),
      Department.deleteMany({}),
      ClassBatch.deleteMany({}),
      QuestionBankItem.deleteMany({}),
      QuestionCollection.deleteMany({}),
      Exam.deleteMany({}),
      ExamAttempt.deleteMany({}),
      FeatureFlag.deleteMany({}),
      UsageQuotaConfig.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    // Create super admin
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'admin@quzify.com',
      password: 'admin123',
      role: 'super_admin',
    });
    console.log('Created super admin: admin@quzify.com / admin123');

    // Create institution
    const institution = await Institution.create({
      name: 'Demo University',
      slug: 'demo-university',
      owner: superAdmin._id,
      type: 'college',
      description: 'A demo institution for testing Quzify platform',
    });

    // Create institution owner
    const owner = await User.create({
      name: 'Dr. Shah',
      email: 'owner@quzify.com',
      password: 'owner123',
      role: 'institution_owner',
      institution: institution._id,
    });
    institution.owner = owner._id;
    await institution.save();

    // Create department
    const csDept = await Department.create({
      name: 'Computer Science',
      institution: institution._id,
      description: 'Department of Computer Science & Engineering',
    });

    // Create faculty
    const faculty = await User.create({
      name: 'Prof. Sharma',
      email: 'faculty@quzify.com',
      password: 'faculty123',
      role: 'faculty',
      institution: institution._id,
      department: csDept._id,
    });

    // Create evaluator
    const evaluator = await User.create({
      name: 'TA Kumar',
      email: 'evaluator@quzify.com',
      password: 'eval123',
      role: 'evaluator',
      institution: institution._id,
      department: csDept._id,
    });

    // Create student
    const student = await User.create({
      name: 'Rahul Patel',
      email: 'student@quzify.com',
      password: 'student123',
      role: 'student',
      institution: institution._id,
      department: csDept._id,
    });

    // Create class
    const classBatch = await ClassBatch.create({
      name: 'CS-2024-A',
      institution: institution._id,
      department: csDept._id,
      students: [student._id],
      faculty: [faculty._id],
      academicYear: '2024-25',
    });

    // Create questions
    const questions = await QuestionBankItem.insertMany([
      {
        type: 'mcq', text: 'What is the time complexity of binary search?',
        options: [
          { label: 'A', text: 'O(n)', isCorrect: false },
          { label: 'B', text: 'O(log n)', isCorrect: true },
          { label: 'C', text: 'O(n²)', isCorrect: false },
          { label: 'D', text: 'O(1)', isCorrect: false },
        ],
        correctAnswer: 'B', explanation: 'Binary search divides the search space in half each time.',
        difficulty: 'easy', bloomLevel: 'remember', subject: 'Data Structures',
        topic: 'Searching', marks: 2, institution: institution._id, createdBy: faculty._id,
      },
      {
        type: 'mcq', text: 'Which data structure uses LIFO principle?',
        options: [
          { label: 'A', text: 'Queue', isCorrect: false },
          { label: 'B', text: 'Array', isCorrect: false },
          { label: 'C', text: 'Stack', isCorrect: true },
          { label: 'D', text: 'Linked List', isCorrect: false },
        ],
        correctAnswer: 'C', explanation: 'Stack follows Last In First Out (LIFO) principle.',
        difficulty: 'easy', bloomLevel: 'remember', subject: 'Data Structures',
        topic: 'Stacks', marks: 2, institution: institution._id, createdBy: faculty._id,
      },
      {
        type: 'mcq', text: 'What is the worst-case time complexity of quicksort?',
        options: [
          { label: 'A', text: 'O(n log n)', isCorrect: false },
          { label: 'B', text: 'O(n²)', isCorrect: true },
          { label: 'C', text: 'O(n)', isCorrect: false },
          { label: 'D', text: 'O(log n)', isCorrect: false },
        ],
        correctAnswer: 'B', explanation: 'Worst case occurs when pivot is always the smallest or largest element.',
        difficulty: 'medium', bloomLevel: 'understand', subject: 'Data Structures',
        topic: 'Sorting', marks: 3, institution: institution._id, createdBy: faculty._id,
      },
      {
        type: 'subjective', text: 'Explain the difference between BFS and DFS traversal algorithms with examples.',
        difficulty: 'medium', bloomLevel: 'analyze', subject: 'Data Structures',
        topic: 'Graph Traversal', marks: 10, institution: institution._id, createdBy: faculty._id,
        rubric: 'Definition of BFS (2 marks), Definition of DFS (2 marks), Example for each (3 marks), Comparison table (3 marks)',
        modelAnswer: 'BFS explores all neighbors at the current depth before moving to nodes at the next depth level. It uses a queue. DFS explores as far as possible along each branch before backtracking. It uses a stack or recursion.',
      },
      {
        type: 'mcq', text: 'Which sorting algorithm is considered stable?',
        options: [
          { label: 'A', text: 'Quick Sort', isCorrect: false },
          { label: 'B', text: 'Heap Sort', isCorrect: false },
          { label: 'C', text: 'Merge Sort', isCorrect: true },
          { label: 'D', text: 'Selection Sort', isCorrect: false },
        ],
        correctAnswer: 'C', difficulty: 'medium', bloomLevel: 'understand',
        subject: 'Data Structures', topic: 'Sorting', marks: 2,
        institution: institution._id, createdBy: faculty._id,
      },
      {
        type: 'coding', text: 'Write a function to reverse a linked list.',
        difficulty: 'hard', bloomLevel: 'apply', subject: 'Data Structures',
        topic: 'Linked Lists', marks: 15, institution: institution._id, createdBy: faculty._id,
        starterCode: 'function reverseLinkedList(head) {\n  // Your code here\n}',
        supportedLanguages: ['javascript', 'python', 'java'],
        testCases: [
          { input: '1->2->3->4->5', expectedOutput: '5->4->3->2->1', isHidden: false, description: 'Basic reversal' },
          { input: '1', expectedOutput: '1', isHidden: false, description: 'Single element' },
          { input: '1->2', expectedOutput: '2->1', isHidden: true, description: 'Two elements' },
        ],
      },
    ]);

    // Create collection
    await QuestionCollection.create({
      name: 'DS Fundamentals',
      description: 'Core data structures questions',
      institution: institution._id,
      questions: questions.map(q => q._id),
      createdBy: faculty._id,
    });

    // Create exam
    const exam = await Exam.create({
      title: 'Data Structures Midterm 2024',
      description: 'Midterm examination covering fundamental data structures and algorithms',
      subject: 'Data Structures',
      topics: ['Searching', 'Sorting', 'Stacks', 'Graph Traversal', 'Linked Lists'],
      institution: institution._id,
      createdBy: faculty._id,
      sections: [
        {
          title: 'Section A - MCQs',
          instructions: 'Choose the correct option. Each question carries 2-3 marks.',
          order: 0,
          questions: questions.filter(q => q.type === 'mcq').map((q, i) => ({
            question: q._id, order: i, marks: q.marks,
          })),
        },
        {
          title: 'Section B - Descriptive',
          instructions: 'Answer in detail.',
          order: 1,
          questions: questions.filter(q => q.type === 'subjective').map((q, i) => ({
            question: q._id, order: i, marks: q.marks,
          })),
        },
        {
          title: 'Section C - Coding',
          instructions: 'Write working code.',
          order: 2,
          questions: questions.filter(q => q.type === 'coding').map((q, i) => ({
            question: q._id, order: i, marks: q.marks,
          })),
        },
      ],
      settings: {
        duration: 90,
        totalMarks: questions.reduce((sum, q) => sum + q.marks, 0),
        passingMarks: 15,
        negativeMarking: false,
        showResults: true,
        instructions: 'This is a closed-book examination. Answer all questions.',
      },
      status: 'published',
      publishedAt: new Date(),
      accessCode: 'DEMO24',
    });

    // Create a demo attempt
    const attempt = await ExamAttempt.create({
      exam: exam._id,
      student: student._id,
      status: 'submitted',
      submittedAt: new Date(),
      startedAt: new Date(Date.now() - 3600000),
      totalScore: 18,
      maxScore: 34,
      percentage: 53,
      timeSpent: 3200,
      answers: [
        { question: questions[0]._id, selectedOption: 'B' },
        { question: questions[1]._id, selectedOption: 'C' },
        { question: questions[2]._id, selectedOption: 'A' },
        { question: questions[3]._id, textAnswer: 'BFS uses queue while DFS uses stack...' },
        { question: questions[4]._id, selectedOption: 'C' },
      ],
    });

    // Feature flags
    await FeatureFlag.insertMany([
      { key: 'ai_generation', enabled: true, description: 'Enable AI-powered content generation' },
      { key: 'coding_assessments', enabled: true, description: 'Enable coding question support' },
      { key: 'collaborative_editing', enabled: false, description: 'Enable real-time collaborative editing' },
      { key: 'proctoring', enabled: false, description: 'Enable exam proctoring features' },
    ]);

    // Usage quota
    await UsageQuotaConfig.create({
      institution: institution._id,
      aiGenerationsLimit: 1000,
      storageLimit: 5000,
      examsLimit: 500,
    });

    console.log(`
╔═══════════════════════════════════════════════╗
║            Seed Data Created!                  ║
╠═══════════════════════════════════════════════╣
║                                               ║
║  Demo Credentials:                            ║
║  ─────────────────────                        ║
║  Super Admin:    admin@quzify.com / admin123  ║
║  Inst. Owner:    owner@quzify.com / owner123  ║
║  Faculty:        faculty@quzify.com / faculty123 ║
║  Evaluator:      evaluator@quzify.com / eval123 ║
║  Student:        student@quzify.com / student123 ║
║                                               ║
║  Demo Exam Code: DEMO24                       ║
║                                               ║
╚═══════════════════════════════════════════════╝
    `);

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
