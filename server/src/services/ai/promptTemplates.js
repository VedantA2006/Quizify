const PROMPT_TEMPLATES = {
  examGeneration: {
    version: '1.0',
    temperature: 0.7,
    maxTokens: 8192,
    system: `You are an expert educational assessment designer. You create high-quality exams with well-structured questions.
You MUST respond ONLY with valid JSON. No markdown, no explanations, no code fences. Just pure JSON.`,
    user: (params) => `Create an exam with the following requirements:
Subject: ${params.subject || 'General'}
Topic(s): ${(Array.isArray(params.topics) ? params.topics.join(', ') : params.topics) || 'General topics'}
Number of questions: ${params.numQuestions || 10}
Question types: ${(Array.isArray(params.questionTypes) ? params.questionTypes.join(', ') : params.questionTypes) || 'mcq'}
Difficulty distribution: ${params.difficulty || 'mixed (30% easy, 50% medium, 20% hard)'}
Duration: ${params.duration || 60} minutes
${params.additionalInstructions || ''}

Respond with this exact JSON structure:
{
  "title": "string",
  "description": "string",
  "subject": "string",
  "topics": ["string"],
  "duration": number,
  "instructions": "string",
  "sections": [{
    "title": "string",
    "instructions": "string",
    "questions": [{
      "type": "mcq|subjective|coding",
      "text": "string",
      "options": [{"label": "A", "text": "string", "isCorrect": boolean}],
      "correctAnswer": "string",
      "explanation": "string",
      "difficulty": "easy|medium|hard|expert",
      "bloomLevel": "remember|understand|apply|analyze|evaluate|create",
      "marks": number,
      "estimatedTime": number,
      "topic": "string",
      "learningOutcome": "string",
      "rubric": "string for subjective",
      "modelAnswer": "string for subjective",
      "starterCode": "string for coding, e.g. function skeleton",
      "supportedLanguages": ["javascript", "python", "java"],
      "testCases": [{"input": "string", "expectedOutput": "string", "isHidden": boolean, "description": "string"}]
    }]
  }]
}`,
  },

  questionGeneration: {
    version: '1.0',
    temperature: 0.7,
    maxTokens: 4096,
    system: `You are an expert question designer for educational assessments. Create precise, unambiguous questions.
You MUST respond ONLY with valid JSON. No markdown, no explanations, no code fences. Just pure JSON.`,
    user: (params) => `Generate ${params.count || 5} ${params.type || 'mcq'} questions:
Subject: ${params.subject || 'General'}
Topic: ${params.topic || 'General'}
Difficulty: ${params.difficulty || 'medium'}
${params.context ? `Context/Resource content: ${params.context}` : ''}

Respond with this exact JSON:
{
  "questions": [{
    "type": "${params.type || 'mcq'}",
    "text": "string",
    "options": [{"label": "A", "text": "string", "isCorrect": boolean}],
    "correctAnswer": "string",
    "explanation": "string",
    "difficulty": "easy|medium|hard|expert",
    "bloomLevel": "remember|understand|apply|analyze|evaluate|create",
    "marks": number,
    "estimatedTime": number,
    "topic": "string",
    "learningOutcome": "string",
    "tags": ["string"]
  }]
}`,
  },

  blueprintGeneration: {
    version: '1.0',
    temperature: 0.5,
    maxTokens: 4096,
    system: `You are an expert exam blueprint designer. Create structured exam plans with balanced coverage.
You MUST respond ONLY with valid JSON. No markdown, no explanations, no code fences. Just pure JSON.`,
    user: (params) => `Design an exam blueprint:
Subject: ${params.subject}
Topics: ${(Array.isArray(params.topics) ? params.topics.join(', ') : params.topics) || 'General'}
Total marks: ${params.totalMarks || 100}
Duration: ${params.duration || 120} minutes
Difficulty split: ${JSON.stringify(params.difficultySplit || { easy: 30, medium: 50, hard: 20 })}
Bloom taxonomy split: ${JSON.stringify(params.bloomSplit || {})}
Question types: ${(Array.isArray(params.questionTypes) ? params.questionTypes.join(', ') : params.questionTypes) || 'mcq, subjective'}

Respond with:
{
  "blueprint": {
    "title": "string",
    "subject": "string",
    "totalMarks": number,
    "duration": number,
    "sections": [{
      "title": "string",
      "marks": number,
      "questionCount": number,
      "questionType": "string",
      "topics": ["string"],
      "difficultyMix": {"easy": number, "medium": number, "hard": number},
      "bloomMix": {}
    }],
    "topicCoverage": {},
    "difficultyDistribution": {},
    "bloomDistribution": {}
  }
}`,
  },

  copilotChat: {
    version: '1.0',
    temperature: 0.7,
    maxTokens: 4096,
    system: `You are an AI exam copilot assistant. Help faculty create and modify exams conversationally.
When asked to modify an exam, respond with instructions and updated content.
You MUST respond ONLY with valid JSON. No markdown, no explanations, no code fences. Just pure JSON.
Respond with: {"message": "string explanation", "action": "modify|suggest|info", "modifications": {} }`,
    user: (params) => `${params.currentExam ? `Current exam: ${JSON.stringify(params.currentExam)}\n\n` : ''}User request: ${params.message}`,
  },

  interactiveExamCopilot: {
    version: '1.0',
    temperature: 0.7,
    maxTokens: 8192,
    system: `You are an expert exam generation AI. You create and modify highly structured exams based on user instructions.
You MUST respond ONLY with valid JSON matching the exact provided schema. Do not include markdown or explanations.`,
    user: (params) => `${params.currentExam ? `Here is the current exam JSON:\n${JSON.stringify(params.currentExam)}\n\nModify the current exam based on this user request:` : `Create a completely new exam based on this user request:`}
"${params.prompt}"

Respond with this exact JSON structure (Output the FULL updated exam JSON, do not use partial patches):
{
  "title": "string",
  "description": "string",
  "subject": "string",
  "topics": ["string"],
  "duration": number,
  "instructions": "string",
  "sections": [{
    "title": "string",
    "instructions": "string",
    "questions": [{
      "type": "mcq|subjective|coding",
      "text": "string",
      "options": [{"label": "A", "text": "string", "isCorrect": boolean}],
      "correctAnswer": "string",
      "explanation": "string",
      "difficulty": "easy|medium|hard|expert",
      "bloomLevel": "remember|understand|apply|analyze|evaluate|create",
      "marks": number,
      "estimatedTime": number,
      "topic": "string",
      "learningOutcome": "string",
      "rubric": "string for subjective",
      "modelAnswer": "string for subjective",
      "starterCode": "string for coding, e.g. function skeleton",
      "supportedLanguages": ["javascript", "python", "java"],
      "testCases": [{"input": "string", "expectedOutput": "string", "isHidden": boolean, "description": "string"}]
    }]
  }]
}`,
  },

  attemptReview: {
    version: '1.1',
    temperature: 0.5,
    maxTokens: 4096,
    system: `You are an expert educational AI tutor. Analyze the student's exam performance and provide constructive, personalized, and encouraging feedback.
You MUST respond ONLY with valid JSON. No markdown, no explanations, no code fences. Just pure JSON.`,
    user: (params) => `Review this student's exam attempt:
Exam Title: ${params.examTitle}
Subject: ${params.subject || 'General'}
Score: ${params.score}/${params.maxScore} (${params.percentage}%)

Questions and Responses:
${params.qaData}

Respond with exactly this JSON structure:
{
  "overall": "A 2-3 sentence overall assessment of their performance.",
  "strengths": ["string", "string"],
  "weaknesses": ["string", "string"],
  "recommendations": ["string", "string", "string"],
  "topicWiseBreakdown": [{
    "topic": "string",
    "score": number,
    "maxScore": number,
    "suggestion": "string"
  }]
}`,
  },

  qualityCheck: {
    version: '1.0',
    temperature: 0.3,
    maxTokens: 2048,
    system: `You are a question quality analyst. Evaluate questions for clarity, difficulty, and pedagogical value.
You MUST respond ONLY with valid JSON. No markdown, no explanations, no code fences. Just pure JSON.`,
    user: (params) => `Evaluate this question:
${JSON.stringify(params.question)}

Respond with:
{
  "qualityScore": number (0-100),
  "flags": ["string"],
  "suggestions": ["string"],
  "analysis": {
    "clarity": number,
    "difficulty_accuracy": number,
    "distractor_quality": number,
    "bloom_accuracy": number
  }
}`,
  },

  rubricGeneration: {
    version: '1.0',
    temperature: 0.5,
    maxTokens: 2048,
    system: `You are an expert in creating assessment rubrics. Create detailed, fair scoring rubrics.
You MUST respond ONLY with valid JSON. No markdown, no explanations, no code fences. Just pure JSON.`,
    user: (params) => `Create a rubric for this question:
Question: ${params.questionText}
Max marks: ${params.marks}
Subject: ${params.subject || 'General'}

Respond with:
{
  "rubric": "detailed rubric text",
  "modelAnswer": "complete model answer",
  "scoringCriteria": [{"criterion": "string", "marks": number, "description": "string"}]
}`,
  },

  cheatDetection: {
    version: '1.0',
    temperature: 0.2,
    maxTokens: 2048,
    system: `You are an expert academic integrity auditor. Analyze student submissions for potential cheating, similarity to reference answers, or external generation.
You MUST respond ONLY with valid JSON. No markdown, no explanations, no code fences. Just pure JSON.`,
    user: (params) => `Analyze the student answer for integrity:
Question: ${params.questionText}
Reference Answers: ${JSON.stringify(params.referenceAnswers)}
Student's Answer: ${params.studentAnswer}

Respond with exactly this JSON structure:
{
  "suspicionScore": number (0-100),
  "reason": "Detailed justification of suspicion or verification of integrity",
  "flag": boolean
}`,
  },
};

const getPrompt = (templateName, params) => {
  const template = PROMPT_TEMPLATES[templateName];
  if (!template) throw new Error(`Prompt template '${templateName}' not found`);

  return {
    messages: [
      { role: 'system', content: template.system },
      { role: 'user', content: template.user(params) },
    ],
    version: template.version,
    templateName,
    temperature: template.temperature || undefined,
    maxTokens: template.maxTokens || undefined,
  };
};

module.exports = { PROMPT_TEMPLATES, getPrompt };
