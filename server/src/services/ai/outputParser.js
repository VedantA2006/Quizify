const extractJSON = (text) => {
  if (!text) return null;

  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch {}

  // Try extracting from code fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {}
  }

  // Try finding JSON object/array in text
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch {}
  }

  // Try to repair common issues
  let cleaned = text
    .replace(/,\s*([}\]])/g, '$1')     // trailing commas
    .replace(/'/g, '"')                  // single quotes
    .replace(/(\w+):/g, '"$1":')        // unquoted keys
    .replace(/""(\w+)""/g, '"$1"');     // double-quoted keys

  // Try extracting JSON again from cleaned text
  const cleanedJsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (cleanedJsonMatch) {
    try {
      return JSON.parse(cleanedJsonMatch[1]);
    } catch {}
  }

  // Remove <think> tags from DeepSeek R1
  const withoutThink = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  if (withoutThink !== text) {
    return extractJSON(withoutThink);
  }

  return null;
};

const validateExamOutput = (data) => {
  if (!data) return { valid: false, errors: ['No data parsed'] };
  const errors = [];

  if (!data.title) errors.push('Missing exam title');
  if (!data.sections || !Array.isArray(data.sections)) {
    errors.push('Missing or invalid sections array');
  } else {
    data.sections.forEach((section, sIdx) => {
      if (!section.questions || !Array.isArray(section.questions)) {
        errors.push(`Section ${sIdx} missing questions array`);
      } else {
        section.questions.forEach((q, qIdx) => {
          if (!q.text) errors.push(`Section ${sIdx}, Question ${qIdx}: missing text`);
          if (!q.type) errors.push(`Section ${sIdx}, Question ${qIdx}: missing type`);
          if (q.type === 'mcq' && (!q.options || q.options.length < 2)) {
            errors.push(`Section ${sIdx}, Question ${qIdx}: MCQ needs at least 2 options`);
          }
        });
      }
    });
  }

  return { valid: errors.length === 0, errors, data };
};

const validateQuestionsOutput = (data) => {
  if (!data) return { valid: false, errors: ['No data parsed'] };
  const errors = [];

  const questions = data.questions || data;
  if (!Array.isArray(questions)) {
    errors.push('Expected questions array');
    return { valid: false, errors };
  }

  questions.forEach((q, idx) => {
    if (!q.text) errors.push(`Question ${idx}: missing text`);
    if (!q.type) q.type = 'mcq';
  });

  return { valid: errors.length === 0, errors, data: { questions } };
};

const normalizeQuestion = (q) => {
  const type = q.type || 'mcq';
  const correctAnswer = q.correctAnswer || q.correct_answer || q.answer || '';
  const options = (q.options || []).map((opt, idx) => {
    const label = opt.label || String.fromCharCode(65 + idx);
    let isCorrect = opt.isCorrect || opt.is_correct || opt.correct || false;
    if (!isCorrect && correctAnswer) {
      const cleanAnswer = correctAnswer.toString().trim().toUpperCase();
      const cleanLabel = label.toString().trim().toUpperCase();
      if (cleanAnswer === cleanLabel) {
        isCorrect = true;
      }
    }
    return {
      label,
      text: (opt.text || opt.option || '').trim(),
      isCorrect,
    };
  });

  return {
    type,
    text: (q.text || q.question || '').trim(),
    options,
    correctAnswer,
  explanation: q.explanation || '',
  difficulty: normalizeEnum(q.difficulty, ['easy', 'medium', 'hard', 'expert'], 'medium'),
  bloomLevel: normalizeEnum(q.bloomLevel || q.bloom_level, ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'], 'understand'),
  subject: q.subject || '',
  topic: q.topic || '',
  marks: q.marks || 1,
  estimatedTime: q.estimatedTime || q.estimated_time || 2,
  rubric: q.rubric || '',
  modelAnswer: q.modelAnswer || q.model_answer || '',
  learningOutcome: q.learningOutcome || q.learning_outcome || '',
  tags: q.tags || [],
  starterCode: q.starterCode || q.starter_code || '',
  supportedLanguages: q.supportedLanguages || q.supported_languages || ['javascript', 'python', 'java'],
  testCases: (q.testCases || q.test_cases || []).map(tc => ({
    input: tc.input || '',
    expectedOutput: tc.expectedOutput || tc.expected_output || tc.expected || '',
    isHidden: tc.isHidden || tc.is_hidden || false,
    description: tc.description || '',
  })),
  };
};

const normalizeEnum = (value, allowed, defaultValue) => {
  if (!value) return defaultValue;
  const lower = value.toLowerCase().trim();
  return allowed.includes(lower) ? lower : defaultValue;
};

const normalizeExamOutput = (data) => {
  if (!data) return null;

  return {
    title: data.title || 'Untitled Exam',
    description: data.description || '',
    subject: data.subject || '',
    topics: data.topics || [],
    duration: data.duration || 60,
    instructions: data.instructions || '',
    sections: (data.sections || []).map((section, idx) => ({
      title: section.title || `Section ${idx + 1}`,
      instructions: section.instructions || '',
      questions: (section.questions || []).map(normalizeQuestion),
    })),
  };
};

module.exports = {
  extractJSON,
  validateExamOutput,
  validateQuestionsOutput,
  normalizeQuestion,
  normalizeExamOutput,
  normalizeEnum,
};
