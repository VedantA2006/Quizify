const AuditTrail = require('../models/AuditTrail');

const auditLog = (action, resource) => {
  return async (req, res, next) => {
    const originalSend = res.json.bind(res);

    res.json = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        AuditTrail.create({
          userId: req.user._id,
          action,
          resource,
          resourceId: req.params.id || body?.data?._id || null,
          details: {
            method: req.method,
            path: req.originalUrl,
            body: sanitizeBody(req.body),
          },
          ip: req.ip,
        }).catch((err) => console.error('Audit log error:', err));
      }
      return originalSend(body);
    };

    next();
  };
};

const sanitizeBody = (body) => {
  if (!body) return {};
  const sanitized = { ...body };
  delete sanitized.password;
  delete sanitized.confirmPassword;
  delete sanitized.token;
  return sanitized;
};

module.exports = { auditLog };
