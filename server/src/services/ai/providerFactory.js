const NvidiaProvider = require('./nvidiaProvider');
const OpenAiProvider = require('./openaiProvider');
const AnthropicProvider = require('./anthropicProvider');

const providers = {
  nvidia: NvidiaProvider,
  openai: OpenAiProvider,
  anthropic: AnthropicProvider,
};

const createProvider = (providerName = 'nvidia') => {
  const name = providerName.toLowerCase();
  const Provider = providers[name];
  if (!Provider) {
    throw new Error(`AI provider '${providerName}' is not supported. Available: ${Object.keys(providers).join(', ')}`);
  }
  return new Provider();
};

module.exports = { createProvider };
