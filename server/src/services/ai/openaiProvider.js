const { OpenAI } = require('openai');
const env = require('../../config/env');

class OpenAiProvider {
  constructor() {
    this.apiKey = env.OPENAI_API_KEY;
    this.model = 'gpt-4o-mini';
    this.client = new OpenAI({ apiKey: this.apiKey });
  }

  async generate(messages, options = {}) {
    const { temperature = 0.6, maxTokens = 4096, retries = 2 } = options;

    if (!this.apiKey) {
      return {
        success: false,
        content: '',
        error: 'OpenAI API Key is not configured',
        model: this.model,
        provider: 'openai',
      };
    }

    let lastError = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const startTime = Date.now();
        const response = await this.client.chat.completions.create({
          model: this.model,
          messages,
          temperature,
          max_tokens: maxTokens,
        });

        const duration = Date.now() - startTime;
        const content = response.choices?.[0]?.message?.content || '';
        const tokensUsed = response.usage?.total_tokens || 0;

        return {
          success: true,
          content,
          tokensUsed,
          duration,
          model: this.model,
          provider: 'openai',
        };
      } catch (error) {
        console.error(`[OpenAI Attempt ${attempt}] Error:`, error.message);
        lastError = error;
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    return {
      success: false,
      content: '',
      error: lastError?.message || 'OpenAI generation failed',
      model: this.model,
      provider: 'openai',
    };
  }
}

module.exports = OpenAiProvider;
