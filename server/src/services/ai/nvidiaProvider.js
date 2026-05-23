const axios = require('axios');
const env = require('../../config/env');

class NvidiaProvider {
  constructor() {
    this.baseURL = env.NVIDIA_API_BASE_URL;
    this.model = env.NVIDIA_MODEL;
    this.apiKey = env.NVIDIA_API_KEY;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 120000,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async generate(messages, options = {}) {
    const { temperature = 0.6, maxTokens = 4096, retries = 2 } = options;

    let lastError = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const startTime = Date.now();
        const response = await this.client.post('/chat/completions', {
          model: this.model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: false,
        });

        const duration = Date.now() - startTime;
        const result = response.data;
        const content = result.choices?.[0]?.message?.content || '';
        const tokensUsed = result.usage?.total_tokens || 0;

        return {
          success: true,
          content,
          tokensUsed,
          duration,
          model: this.model,
          provider: 'nvidia',
        };
      } catch (error) {
        lastError = error;
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    return {
      success: false,
      content: '',
      error: lastError?.response?.data?.error?.message || lastError?.message || 'AI generation failed',
      model: this.model,
      provider: 'nvidia',
    };
  }
}

module.exports = NvidiaProvider;
