/**
 * Normalizes request strings and removes prototype-pollution keys.
 * HTML is escaped at output sinks so stored data remains canonical.
 */
export const sanitizeRequest = (req, res, next) => {
  const preserveWhitespace = new Set(['password', 'newPassword', 'token']);

  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    for (const key of Object.keys(obj)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        delete obj[key];
        continue;
      }

      if (typeof obj[key] === 'string') {
        if (!preserveWhitespace.has(key)) {
          obj[key] = obj[key].trim();
        }
      } else if (obj[key] && typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};
