const { createProvider } = require('./providerFactory');
const { getPrompt } = require('./promptTemplates');
const { extractJSON, validateExamOutput, validateQuestionsOutput, normalizeExamOutput, normalizeQuestion } = require('./outputParser');
const AiGenerationLog = require('../../models/AiGenerationLog');
const env = require('../../config/env');

function compressExam(exam, promptMessage = '') {
  if (!exam) return null;

  // Do NOT compress if prompt asks to edit or view a specific question
  const questionNumberRegex = /(question|q|item|#)\s*\d+/i;
  if (promptMessage && questionNumberRegex.test(promptMessage)) {
    return exam;
  }

  // Count questions
  const questionCount = exam.sections?.reduce((sum, s) => sum + (s.questions?.length || 0), 0) || 0;
  if (questionCount > 3) {
    const compressed = {
      title: exam.title,
      description: exam.description,
      subject: exam.subject,
      topics: exam.topics,
      duration: exam.duration,
      instructions: exam.instructions,
      sections: exam.sections?.map(s => ({
        title: s.title,
        instructions: s.instructions,
        questionCount: s.questions?.length || 0,
        totalMarks: s.questions?.reduce((sum, q) => sum + (q.marks || 0), 0) || 0,
        questions: s.questions?.map((q, idx) => ({
          number: idx + 1,
          type: q.type,
          text: q.text,
          marks: q.marks,
          difficulty: q.difficulty,
        }))
      }))
    };
    return compressed;
  }

  return exam;
}

class AiService {
  constructor(provider) {
    this.provider = provider || createProvider(env.AI_PRIMARY_PROVIDER || 'nvidia');
  }

  /**
   * Generates AI responses with active fallback provider mechanisms on failure
   */
  async generateWithFallback(messages, options = {}) {
    let result = await this.provider.generate(messages, options);
    if (result.success) return result;

    const fallbackName = env.AI_FALLBACK_PROVIDER;
    const primaryName = env.AI_PRIMARY_PROVIDER || 'nvidia';

    if (fallbackName && fallbackName.toLowerCase() !== primaryName.toLowerCase()) {
      console.warn(`[AiService] Primary provider '${primaryName}' failed: ${result.error}. Retrying with fallback provider '${fallbackName}'...`);
      try {
        const fallbackProvider = createProvider(fallbackName);
        const fallbackResult = await fallbackProvider.generate(messages, options);
        if (fallbackResult.success) {
          return fallbackResult;
        }
        result.error = `Primary failed (${result.error}); Fallback failed (${fallbackResult.error})`;
      } catch (err) {
        console.error('[AiService] Failed to execute fallback AI provider:', err);
      }
    }
    return result;
  }

  async generateExam(params, userId, institutionId) {
    const promptDetails = getPrompt('examGeneration', params);
    const result = await this.generateWithFallback(promptDetails.messages, {
      temperature: promptDetails.temperature || 0.7,
      maxTokens: promptDetails.maxTokens || 8192,
    });

    const log = await this._logGeneration({
      userId, institutionId, result, messages: promptDetails.messages,
      generationType: 'exam', version: promptDetails.version, templateName: promptDetails.templateName,
    });

    if (!result.success) {
      return { success: false, error: result.error, logId: log._id };
    }

    const parsed = extractJSON(result.content);
    const validation = validateExamOutput(parsed);

    if (!validation.valid) {
      await AiGenerationLog.findByIdAndUpdate(log._id, {
        status: 'partial',
        error: validation.errors.join('; '),
      });
      if (parsed) {
        const normalized = normalizeExamOutput(parsed);
        return { success: true, data: normalized, warnings: validation.errors, logId: log._id };
      }
      return { success: false, error: 'Failed to parse AI output', errors: validation.errors, logId: log._id };
    }

    const normalized = normalizeExamOutput(parsed);
    await AiGenerationLog.findByIdAndUpdate(log._id, { parsedOutput: normalized });

    return { success: true, data: normalized, logId: log._id };
  }

  async generateQuestions(params, userId, institutionId) {
    const promptDetails = getPrompt('questionGeneration', params);
    const result = await this.generateWithFallback(promptDetails.messages, {
      temperature: promptDetails.temperature || 0.7,
      maxTokens: promptDetails.maxTokens || 4096,
    });

    const log = await this._logGeneration({
      userId, institutionId, result, messages: promptDetails.messages,
      generationType: 'questions', version: promptDetails.version, templateName: promptDetails.templateName,
    });

    if (!result.success) {
      return { success: false, error: result.error, logId: log._id };
    }

    const parsed = extractJSON(result.content);
    const validation = validateQuestionsOutput(parsed);

    if (!validation.valid) {
      return { success: false, error: 'Failed to parse questions', errors: validation.errors, logId: log._id };
    }

    const questions = (validation.data.questions || []).map(normalizeQuestion);
    await AiGenerationLog.findByIdAndUpdate(log._id, { parsedOutput: { questions } });

    return { success: true, data: { questions }, logId: log._id };
  }

  async generateBlueprint(params, userId, institutionId) {
    const promptDetails = getPrompt('blueprintGeneration', params);
    const result = await this.generateWithFallback(promptDetails.messages, {
      temperature: promptDetails.temperature || 0.5,
      maxTokens: promptDetails.maxTokens || 4096,
    });

    const log = await this._logGeneration({
      userId, institutionId, result, messages: promptDetails.messages,
      generationType: 'blueprint', version: promptDetails.version, templateName: promptDetails.templateName,
    });

    if (!result.success) {
      return { success: false, error: result.error, logId: log._id };
    }

    const parsed = extractJSON(result.content);
    if (!parsed) {
      return { success: false, error: 'Failed to parse blueprint', logId: log._id };
    }

    await AiGenerationLog.findByIdAndUpdate(log._id, { parsedOutput: parsed });
    return { success: true, data: parsed, logId: log._id };
  }

  async copilotChat(params, userId, institutionId) {
    // Compress exam skeleton for token budget efficiency
    const optimizedParams = { ...params };
    if (params.currentExam) {
      optimizedParams.currentExam = compressExam(params.currentExam, params.message);
    }

    const promptDetails = getPrompt('copilotChat', optimizedParams);
    const result = await this.generateWithFallback(promptDetails.messages, {
      temperature: promptDetails.temperature || 0.7,
      maxTokens: promptDetails.maxTokens || 4096,
    });

    const log = await this._logGeneration({
      userId, institutionId, result, messages: promptDetails.messages,
      generationType: 'copilot', version: promptDetails.version, templateName: promptDetails.templateName,
    });

    if (!result.success) {
      return { success: false, error: result.error, logId: log._id };
    }

    const parsed = extractJSON(result.content);
    return {
      success: true,
      data: parsed || { message: result.content, action: 'info' },
      logId: log._id,
    };
  }

  async checkQuality(params, userId, institutionId) {
    const promptDetails = getPrompt('qualityCheck', params);
    const result = await this.generateWithFallback(promptDetails.messages, {
      temperature: promptDetails.temperature || 0.3,
      maxTokens: promptDetails.maxTokens || 2048,
    });

    const log = await this._logGeneration({
      userId, institutionId, result, messages: promptDetails.messages,
      generationType: 'quality_check', version: promptDetails.version, templateName: promptDetails.templateName,
    });

    if (!result.success) {
      return { success: false, error: result.error, logId: log._id };
    }

    const parsed = extractJSON(result.content);
    return { success: true, data: parsed, logId: log._id };
  }

  async generateRubric(params, userId, institutionId) {
    const promptDetails = getPrompt('rubricGeneration', params);
    const result = await this.generateWithFallback(promptDetails.messages, {
      temperature: promptDetails.temperature || 0.5,
      maxTokens: promptDetails.maxTokens || 2048,
    });

    const log = await this._logGeneration({
      userId, institutionId, result, messages: promptDetails.messages,
      generationType: 'rubric', version: promptDetails.version, templateName: promptDetails.templateName,
    });

    if (!result.success) {
      return { success: false, error: result.error, logId: log._id };
    }

    const parsed = extractJSON(result.content);
    return { success: true, data: parsed, logId: log._id };
  }

  async generateReview(params, userId, institutionId) {
    const promptDetails = getPrompt('attemptReview', params);
    const result = await this.generateWithFallback(promptDetails.messages, {
      temperature: promptDetails.temperature || 0.5,
      maxTokens: promptDetails.maxTokens || 4096,
    });

    const log = await this._logGeneration({
      userId, institutionId, result, messages: promptDetails.messages,
      generationType: 'review', version: promptDetails.version, templateName: promptDetails.templateName,
    });

    if (!result.success) {
      return { success: false, error: result.error, logId: log._id };
    }

    const parsed = extractJSON(result.content);
    if (!parsed) {
      return { success: false, error: 'Failed to parse review', logId: log._id };
    }

    await AiGenerationLog.findByIdAndUpdate(log._id, { parsedOutput: parsed });
    return { success: true, data: parsed, logId: log._id };
  }

  async detectCheating(params, userId, institutionId) {
    const promptDetails = getPrompt('cheatDetection', params);
    const result = await this.generateWithFallback(promptDetails.messages, {
      temperature: promptDetails.temperature || 0.2,
      maxTokens: promptDetails.maxTokens || 2048,
    });

    const log = await this._logGeneration({
      userId, institutionId, result, messages: promptDetails.messages,
      generationType: 'cheat_detection', version: promptDetails.version, templateName: promptDetails.templateName,
    });

    if (!result.success) {
      return { success: false, error: result.error, logId: log._id };
    }

    const parsed = extractJSON(result.content);
    return { success: true, data: parsed || { suspicionScore: 0, reason: 'Evaluation offline', flag: false }, logId: log._id };
  }

  async chatExamGeneration(params, userId, institutionId) {
    // Compress exam skeleton for token budget efficiency
    const optimizedParams = { ...params };
    if (params.currentExam) {
      optimizedParams.currentExam = compressExam(params.currentExam, params.prompt);
    }

    const promptDetails = getPrompt('interactiveExamCopilot', optimizedParams);
    const result = await this.generateWithFallback(promptDetails.messages, {
      temperature: promptDetails.temperature || 0.7,
      maxTokens: promptDetails.maxTokens || 8192,
    });

    const log = await this._logGeneration({
      userId, institutionId, result, messages: promptDetails.messages,
      generationType: 'exam', version: promptDetails.version, templateName: promptDetails.templateName,
    });

    if (!result.success) {
      return { success: false, error: result.error, logId: log._id };
    }

    const parsed = extractJSON(result.content);
    if (!parsed) {
      return { success: false, error: 'Failed to parse JSON exam output', logId: log._id };
    }

    const normalized = normalizeExamOutput(parsed);
    await AiGenerationLog.findByIdAndUpdate(log._id, { parsedOutput: normalized });

    return { success: true, data: normalized, logId: log._id };
  }

  async _logGeneration({ userId, institutionId, result, messages, generationType, version, templateName }) {
    return AiGenerationLog.create({
      userId,
      institution: institutionId,
      provider: result.provider || 'nvidia',
      model: result.model || 'unknown',
      promptVersion: version,
      promptTemplate: templateName,
      prompt: messages.map(m => `${m.role}: ${m.content}`).join('\n\n'),
      rawResponse: result.content || '',
      status: result.success ? 'success' : 'failed',
      error: result.error || null,
      generationType,
      tokensUsed: result.tokensUsed || 0,
      duration: result.duration || 0,
    });
  }
}

module.exports = new AiService();
