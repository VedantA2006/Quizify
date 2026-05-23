const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');
const Joi = require('joi');

const validate = (validations) => {
  return async (req, res, next) => {
    for (const validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return next(ApiError.badRequest('Validation failed', extractedErrors));
  };
};

const validateJoi = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const details = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message,
      }));
      return next(ApiError.badRequest('Validation failed', details));
    }
    req.body = value; // Replace body with stripUnknown sanitized values
    next();
  };
};

module.exports = { validate, validateJoi };
