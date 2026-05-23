const { createProvider } = require('./providerFactory');
const { getPrompt } = require('./promptTemplates');
const { extractJSON, validateExamOutput, validateQuestionsOutput, normalizeExamOutput, normalizeQuestion } = require('./outputParser');
const AiGenerationLog = require('../../models/AiGenerationLog');

class AiService {
  constructor() {
    this.provider = createProvider('nvidia');
  }

  async generateExam(params, userId, institutionId) {
    const { messages, version, templateName } = getPrompt('examGeneration', params);
    const startTime = Date.now();

    const result = await this.provider.generate(messages, {
      temperature: 0.7,
      maxTokens: 8192,
    });

    const log = await this._logGeneration({
      userId, institutionId, result, messages,
      generationType: 'exam', version, templateName,
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
      // Still return partial data if we have something
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
    const { messages, version, templateName } = getPrompt('questionGeneration', params);

    const result = await this.provider.generate(messages, {
      temperature: 0.7,
      maxTokens: 4096,
    });

    const log = await this._logGeneration({
      userId, institutionId, result, messages,
      generationType: 'questions', version, templateName,
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
    const { messages, version, templateName } = getPrompt('blueprintGeneration', params);

    const result = await this.provider.generate(messages, { temperature: 0.5, maxTokens: 4096 });
    const log = await this._logGeneration({
      userId, institutionId, result, messages,
      generationType: 'blueprint', version, templateName,
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
    const { messages, version, templateName } = getPrompt('copilotChat', params);

    const result = await this.provider.generate(messages, { temperature: 0.7, maxTokens: 4096 });
    const log = await this._logGeneration({
      userId, institutionId, result, messages,
      generationType: 'copilot', version, templateName,
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
    const { messages, version, templateName } = getPrompt('qualityCheck', params);

    const result = await this.provider.generate(messages, { temperature: 0.3, maxTokens: 2048 });
    const log = await this._logGeneration({
      userId, institutionId, result, messages,
      generationType: 'quality_check', version, templateName,
    });

    if (!result.success) {
      return { success: false, error: result.error, logId: log._id };
    }

    const parsed = extractJSON(result.content);
    return { success: true, data: parsed, logId: log._id };
  }

  async generateRubric(params, userId, institutionId) {
    const { messages, version, templateName } = getPrompt('rubricGeneration', params);

    const result = await this.provider.generate(messages, { temperature: 0.5, maxTokens: 2048 });
    const log = await this._logGeneration({
      userId, institutionId, result, messages,
      generationType: 'rubric', version, templateName,
    });

    if (!result.success) {
      return { success: false, error: result.error, logId: log._id };
    }

    const parsed = extractJSON(result.content);
    return { success: true, data: parsed, logId: log._id };
  }

  async generateReview(params, userId, institutionId) {
    const { messages, version, templateName } = getPrompt('attemptReview', params);

    const result = await this.provider.generate(messages, { temperature: 0.5, maxTokens: 4096 });
    const log = await this._logGeneration({
      userId, institutionId, result, messages,
      generationType: 'review', version, templateName,
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

  async chatExamGeneration(params, userId, institutionId) {
    const { messages, version, templateName } = getPrompt('interactiveExamCopilot', params);

    const result = await this.provider.generate(messages, { temperature: 0.7, maxTokens: 8192 });
    const log = await this._logGeneration({
      userId, institutionId, result, messages,
      generationType: 'exam', version, templateName,
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
