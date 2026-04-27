import validator from 'validator';

/**
 * Middleware to sanitize all string values in req.body, req.query, and req.params
 * to prevent XSS by escaping HTML entities.
 */
export const sanitizeRequest = (req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = validator.escape(obj[key].trim());
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};
