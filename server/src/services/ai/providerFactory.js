const NvidiaProvider = require('./nvidiaProvider');

const providers = {
  nvidia: NvidiaProvider,
};

const createProvider = (providerName = 'nvidia') => {
  const Provider = providers[providerName];
  if (!Provider) {
    throw new Error(`AI provider '${providerName}' is not supported. Available: ${Object.keys(providers).join(', ')}`);
  }
  return new Provider();
};

module.exports = { createProvider };
