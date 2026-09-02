import validator from 'validator';

/**
 * Keys that must not have their characters HTML-escaped
 * (e.g. URLs containing '/', '&', '?' or credentials)
 */
const SKIP_SANITIZE_KEYS = new Set([
  'photourl',
  'profilepicurl',
  'avatar',
  'url',
  'image',
  'redirecturl',
  'mediaurl',
  'link',
  'password',
  'newpassword',
  'oldpassword',
  'token',
  'refreshtoken',
  'accesstoken',
  'code'
]);

/**
 * Middleware to sanitize string values in req.body, req.query, and req.params
 * to prevent XSS by escaping HTML entities on user text inputs while preserving URLs.
 */
export const sanitizeRequest = (req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        const lowerKey = key.toLowerCase();
        if (SKIP_SANITIZE_KEYS.has(lowerKey) || lowerKey.endsWith('url')) {
          obj[key] = obj[key].trim();
        } else {
          obj[key] = validator.escape(obj[key].trim());
        }
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

