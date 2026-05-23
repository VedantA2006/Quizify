const { Anthropic } = require('@anthropic-ai/sdk');
const env = require('../../config/env');

class AnthropicProvider {
  constructor() {
    this.apiKey = env.ANTHROPIC_API_KEY;
    this.model = 'claude-3-5-haiku-20241022';
    this.client = new Anthropic({ apiKey: this.apiKey });
  }

  async generate(messages, options = {}) {
    const { temperature = 0.6, maxTokens = 4096, retries = 2 } = options;

    if (!this.apiKey) {
      return {
        success: false,
        content: '',
        error: 'Anthropic API Key is not configured',
        model: this.model,
        provider: 'anthropic',
      };
    }

    // Map system role if needed or convert openai system format to anthropic system
    let systemPrompt = '';
    const formattedMessages = messages.filter(msg => {
      if (msg.role === 'system') {
        systemPrompt = msg.content;
        return false;
      }
      return true;
    });

    let lastError = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const startTime = Date.now();
        const response = await this.client.messages.create({
          model: this.model,
          messages: formattedMessages,
          system: systemPrompt || undefined,
          max_tokens: maxTokens,
          temperature,
        });

        const duration = Date.now() - startTime;
        const content = response.content?.[0]?.text || '';
        const tokensUsed = response.usage?.input_tokens + response.usage?.output_tokens || 0;

        return {
          success: true,
          content,
          tokensUsed,
          duration,
          model: this.model,
          provider: 'anthropic',
        };
      } catch (error) {
        console.error(`[Anthropic Attempt ${attempt}] Error:`, error.message);
        lastError = error;
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    return {
      success: false,
      content: '',
      error: lastError?.message || 'Anthropic generation failed',
      model: this.model,
      provider: 'anthropic',
    };
  }
}

module.exports = AnthropicProvider;
