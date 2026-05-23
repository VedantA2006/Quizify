const dotenv = require('dotenv');
dotenv.config();

const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/quzify',
  JWT_SECRET: process.env.JWT_SECRET || 'default-dev-secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  NVIDIA_API_KEY: process.env.NVIDIA_API_KEY || '',
  NVIDIA_API_BASE_URL: process.env.NVIDIA_API_BASE_URL || 'https://integrate.api.nvidia.com/v1',
  NVIDIA_MODEL: process.env.NVIDIA_MODEL || 'deepseek-ai/deepseek-r1-distill-qwen-32b',
  STORAGE_DRIVER: process.env.STORAGE_DRIVER || 'local',
  MAX_UPLOAD_MB: parseInt(process.env.MAX_UPLOAD_MB || '50', 10),

  // New environment variables added in Phase 1 & 3
  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT || '2525', 10),
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASS: process.env.EMAIL_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@quzify.com',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JUDGE0_API_URL: process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com',
  JUDGE0_API_KEY: process.env.JUDGE0_API_KEY || '',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || '',
  AI_PRIMARY_PROVIDER: process.env.AI_PRIMARY_PROVIDER || 'nvidia',
  AI_FALLBACK_PROVIDER: process.env.AI_FALLBACK_PROVIDER || 'openai',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
};

// Startup validation for production environment
if (env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET) {
    throw new Error('FATAL CONFIG ERROR: JWT_SECRET environment variable is required in production mode.');
  }
  if (!process.env.MONGODB_URI) {
    throw new Error('FATAL CONFIG ERROR: MONGODB_URI environment variable is required in production mode.');
  }
  if (!process.env.NVIDIA_API_KEY) {
    throw new Error('FATAL CONFIG ERROR: NVIDIA_API_KEY environment variable is required in production mode.');
  }
}

module.exports = env;
