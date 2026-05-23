/**
 * Sandbox Service for Code Execution
 * In a production environment, this would interface with a containerized 
 * execution environment (like Judge0, or a custom Docker-based runner).
 */

class SandboxService {
  /**
   * Executes code against a set of test cases
   * @param {string} code - The student's code
   * @param {string} language - The programming language
   * @param {Array} testCases - Array of {input, expectedOutput, isHidden}
   * @returns {Promise<Object>} - Results for each test case
   */
  async execute(code, language, testCases) {
    if (!code) throw new Error('Code is required');
    if (!testCases || !testCases.length) return { results: [], overallPass: true };

    console.log(`[Sandbox] Executing ${language} code...`);
    
    // Simulate execution delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const results = testCases.map((tc, index) => {
      // PROTOTYPE LOGIC: For now, we simulate success if the code contains 
      // some keywords or logic that matches the expected output.
      // In a real sandbox, this would be the actual output from the process.
      
      const isPassed = this._simulateEvaluation(code, tc);
      
      return {
        testCaseId: index,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: isPassed ? tc.expectedOutput : 'Runtime Error or Incorrect Output',
        status: isPassed ? 'passed' : 'failed',
        isHidden: tc.isHidden,
        executionTime: Math.random() * 100, // ms
        memoryUsage: Math.random() * 10, // MB
      };
    });

    const passedCount = results.filter(r => r.status === 'passed').length;
    
    return {
      results,
      passedCount,
      totalCount: testCases.length,
      overallPass: passedCount === testCases.length,
      score: Math.round((passedCount / testCases.length) * 100)
    };
  }

  /**
   * Mock evaluation logic for the prototype
   */
  _simulateEvaluation(code, testCase) {
    // If it's a simple "Hello World" or arithmetic, we'll just say it passed
    // for the sake of the demo. 
    // Real logic would be: child_process.exec or a REST call to Judge0.
    if (!code || code.length < 10) return false;
    
    // Special case: if code contains a return of the expected output, pass it
    if (code.includes(testCase.expectedOutput)) return true;
    
    return Math.random() > 0.3; // 70% success rate for mock simulation
  }
}

module.exports = new SandboxService();
