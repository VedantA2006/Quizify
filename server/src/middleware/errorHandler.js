const ApiError = require('../utils/ApiError');
const env = require('../config/env');

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message);
  }

  const response = {
    success: false,
    message: error.message,
    ...(error.errors.length && { errors: error.errors }),
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  if (env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  res.status(error.statusCode).json(response);
};

module.exports = errorHandler;
