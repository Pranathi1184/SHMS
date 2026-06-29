const parseBoolean = (value, fallback) => {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === 'true';
};

const featureFlags = (req, res, next) => {
  req.featureFlags = {
    smartSchedulingAssistant: parseBoolean(process.env.FEATURE_SMART_SCHEDULING_ASSISTANT, true),
    enhancedNotifications: parseBoolean(process.env.FEATURE_ENHANCED_NOTIFICATIONS, true),
    auditTrail: parseBoolean(process.env.FEATURE_AUDIT_TRAIL, true),
    roleDashboardVariants: parseBoolean(process.env.FEATURE_ROLE_DASHBOARD_VARIANTS, true),
  };

  next();
};

module.exports = {
  featureFlags,
};
