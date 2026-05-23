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
};

module.exports = env;
