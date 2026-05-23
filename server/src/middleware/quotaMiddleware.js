const Institution = require('../models/Institution');
const ApiError = require('../utils/ApiError');

/**
 * Middleware to check if an institution has remaining quota for a specific resource
 * @param {string} quotaType - The type of quota to check (e.g., 'aiGenerations')
 */
exports.checkQuota = (quotaType) => {
  return async (req, res, next) => {
    try {
      if (!req.user.institution) {
        throw ApiError.forbidden('User does not belong to any institution');
      }

      const institution = await Institution.findById(req.user.institution);
      if (!institution) {
        throw ApiError.notFound('Institution not found');
      }

      const limit = institution.quotas[`${quotaType}Limit`];
      const used = institution.quotas[`${quotaType}Used`];

      if (used >= limit) {
        throw ApiError.forbidden(`Quota exceeded for ${quotaType}. Current limit: ${limit}. Please upgrade your plan.`);
      }

      // Add institution to request for easy access in controller
      req.institution = institution;
      next();
    } catch (error) {
      next(error);
    }
  };
};
