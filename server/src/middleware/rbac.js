const ApiError = require('../utils/ApiError');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    next();
  };
};

const authorizeInstitution = (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (req.user.role === 'super_admin') return next();

  const institutionId = req.params.institutionId || req.body.institution || req.user.institution;
  if (!institutionId) return next(ApiError.badRequest('Institution context required'));

  if (req.user.institution && req.user.institution.toString() !== institutionId.toString()) {
    return next(ApiError.forbidden('Cross-institution access denied'));
  }

  req.institutionId = institutionId;
  next();
};

module.exports = { authorize, authorizeInstitution };
