const mongoose = require('mongoose');
const env = require('./config/env');
const QuestionBankItem = require('./models/QuestionBankItem');
const Exam = require('./models/Exam');

const runFix = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const exam = await Exam.findOne({ title: 'Java Coding Exam' }).populate('sections.questions.question');
    if (!exam) {
      console.error('Java Coding Exam not found');
      process.exit(1);
    }

    console.log(`Found exam: ${exam.title}`);

    const updates = [
      {
        textPart: 'sum of two integers',
        starterCode: `public class SumExample {\n    public static int calculateSum(int a, int b) {\n        // Your code here\n        return 0;\n    }\n}`,
        testCases: [
          { input: '10, 20', expectedOutput: '30', isHidden: false, description: 'Sum of 10 and 20' },
          { input: '-5, 5', expectedOutput: '0', isHidden: false, description: 'Sum of -5 and 5' }
        ]
      },
      {
        textPart: 'print the first 10 numbers in the Fibonacci sequence',
        starterCode: `public class FibonacciExample {\n    public static void printFibonacci() {\n        // Your code here\n    }\n}`,
        testCases: [
          { input: '10', expectedOutput: '0, 1, 1, 2, 3, 5, 8, 13, 21, 34', isHidden: false, description: 'First 10 terms of Fibonacci' }
        ]
      },
      {
        textPart: 'calculate the average of an array of integers',
        starterCode: `public class AverageExample {\n    public static double calculateAverage(int[] arr) {\n        // Your code here\n        return 0.0;\n    }\n}`,
        testCases: [
          { input: '[1, 2, 3, 4, 5]', expectedOutput: '3', isHidden: false, description: 'Average of 1 to 5' }
        ]
      },
      {
        textPart: 'Fibonacci sequence using recursion',
        starterCode: `public class FibonacciRecursive {\n    public static int fib(int n) {\n        // Your code here\n        return 0;\n    }\n}`,
        testCases: [
          { input: '10', expectedOutput: '0, 1, 1, 2, 3, 5, 8, 13, 21, 34', isHidden: false, description: 'Recursive Fibonacci first 10 terms' }
        ]
      },
      {
        textPart: 'factorial of a given integer',
        starterCode: `public class FactorialExample {\n    public static int factorial(int n) {\n        // Your code here\n        return 1;\n    }\n}`,
        testCases: [
          { input: '5', expectedOutput: '120', isHidden: false, description: 'Factorial of 5' }
        ]
      }
    ];

    for (const section of exam.sections || []) {
      for (const q of section.questions || []) {
        const questionItem = q.question;
        if (questionItem && questionItem.type === 'coding') {
          const update = updates.find(u => questionItem.text.toLowerCase().includes(u.textPart.toLowerCase()));
          if (update) {
            questionItem.starterCode = update.starterCode;
            questionItem.testCases = update.testCases;
            questionItem.supportedLanguages = ['java', 'javascript', 'python'];
            await questionItem.save();
            console.log(`Updated question: "${questionItem.text.substring(0, 40)}..." with starter code and test cases.`);
          }
        }
      }
    }

    console.log('Migration finished successfully!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

runFix();
